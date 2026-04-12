import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { MapPinAreaIcon } from "@phosphor-icons/react/dist/csr/MapPinArea";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useDeferredValue, useMemo, useState } from "react";
import { useIsMobile } from "#/hooks/use-mobile";
import { useIsTouchDevice } from "#/hooks/use-touch-device";
import type { CitiBikeStation } from "#/lib/citibike";
import { isStationActive } from "#/lib/station";
import {
  getStationRegion,
  type StationRegionLabel,
} from "#/lib/station-region";
import { cn } from "#/lib/utils";
import { CloseButton } from "./close-button";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "./ui/drawer";
import { Input } from "./ui/input";
import { Kbd, KbdGroup } from "./ui/kbd";

const MAX_VISIBLE_STATIONS = 50;
const SEARCH_SEPARATOR_PATTERN = /[^a-z0-9]+/g;
type StationGroupHeading = StationRegionLabel | "Other";

interface SearchableStation {
  originalIndex: number;
  station: CitiBikeStation;
  searchableText: string;
  searchableTokens: string[];
}

interface StationSearchResult {
  originalIndex: number;
  score: number;
  station: CitiBikeStation;
}

interface VisibleStationState {
  hasMoreResults: boolean;
  stations: CitiBikeStation[];
}

const REGION_GROUP_ORDER: readonly StationGroupHeading[] = [
  "NYC",
  "Jersey City",
  "Hoboken",
  "Other",
];
const REGION_GROUP_INDEX = new Map<StationGroupHeading, number>(
  REGION_GROUP_ORDER.map((label, index): [StationGroupHeading, number] => [
    label,
    index,
  ]),
);

interface StationSearchProps {
  stations: CitiBikeStation[];
  onSelectStation: (station: CitiBikeStation) => void;
}

interface StationSearchResultsProps {
  visibleGroups: {
    heading: string;
    stations: CitiBikeStation[];
  }[];
  onSelectStation: (station: CitiBikeStation) => void;
}

function compareStationSearchResults(
  resultA: StationSearchResult,
  resultB: StationSearchResult,
) {
  return (
    resultB.score - resultA.score ||
    resultA.originalIndex - resultB.originalIndex
  );
}

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(SEARCH_SEPARATOR_PATTERN, " ").trim();
}

function getSearchTokens(value: string) {
  return normalizeSearchText(value).split(/\s+/).filter(Boolean);
}

function getBestTokenMatch(queryToken: string, searchableTokens: string[]) {
  let bestScore = 0;
  let bestIndex = -1;

  searchableTokens.forEach((token, index) => {
    const score =
      token === queryToken
        ? 120
        : token.startsWith(queryToken)
          ? 90
          : token.includes(queryToken)
            ? 60
            : 0;

    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  return { index: bestIndex, score: bestScore };
}

function getStationSearchScore(
  searchableStation: SearchableStation,
  normalizedQuery: string,
  queryTokens: string[],
) {
  let score = 0;
  const tokenPositions: number[] = [];

  if (searchableStation.searchableText.startsWith(normalizedQuery)) {
    score += 240;
  } else if (searchableStation.searchableText.includes(normalizedQuery)) {
    score += 180;
  }

  for (const queryToken of queryTokens) {
    const tokenMatch = getBestTokenMatch(
      queryToken,
      searchableStation.searchableTokens,
    );

    if (tokenMatch.score === 0) {
      return null;
    }

    score += tokenMatch.score;
    tokenPositions.push(tokenMatch.index);
  }

  const isInQueryOrder = tokenPositions.every(
    (position, index) => index === 0 || position > tokenPositions[index - 1],
  );

  if (isInQueryOrder) {
    score += 80;
    score += Math.max(
      0,
      24 - (tokenPositions[tokenPositions.length - 1] - tokenPositions[0]),
    );
  }

  return score;
}

function StationSearchResultContent({ station }: { station: CitiBikeStation }) {
  const region = getStationRegion(station.region_id, station.station_id);
  const isActive = isStationActive(station);

  return (
    <>
      <MapPinAreaIcon className={cn("shrink-0", region?.pinClassName)} />
      <span className="truncate">{station.name}</span>
      {!isActive && (
        <Badge variant="offline" aria-label="Offline" className="ml-auto">
          Offline
        </Badge>
      )}
    </>
  );
}

function MobileStationSearchResults({
  visibleGroups,
  onSelectStation,
}: StationSearchResultsProps) {
  if (visibleGroups.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        No results found.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {visibleGroups.map((group) => (
        <section key={group.heading} className="flex flex-col gap-1">
          <h3 className="text-muted-foreground p-1.5 text-xs font-medium">
            {group.heading}
          </h3>
          {group.stations.map((station) => (
            <button
              key={station.station_id}
              type="button"
              className="hover:bg-accent focus-visible:border-ring focus-visible:ring-ring/50 flex w-full items-center gap-2 rounded-xl p-2 text-left text-sm transition-colors outline-none focus-visible:ring-[3px]"
              onClick={() => onSelectStation(station)}
            >
              <StationSearchResultContent station={station} />
            </button>
          ))}
        </section>
      ))}
    </div>
  );
}

export function StationSearch({
  stations,
  onSelectStation,
}: StationSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const isMobile = useIsMobile();
  const isTouchDevice = useIsTouchDevice();
  const useMobileSearch = isMobile || isTouchDevice;
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = normalizeSearchText(deferredQuery);

  const searchableStations = useMemo(
    () =>
      stations.map((station, originalIndex) => {
        const searchableText = normalizeSearchText(
          [station.name, station.short_name, station.station_id]
            .filter(Boolean)
            .join(" "),
        );

        return {
          originalIndex,
          searchableText,
          searchableTokens: getSearchTokens(searchableText),
          station,
        };
      }),
    [stations],
  );

  const defaultVisibleStations = useMemo(
    () =>
      [...stations]
        .sort(
          (stationA, stationB) =>
            (stationB.num_ebikes_available ?? 0) -
            (stationA.num_ebikes_available ?? 0),
        )
        .slice(0, MAX_VISIBLE_STATIONS),
    [stations],
  );

  const { hasMoreResults, stations: visibleStations } =
    useMemo<VisibleStationState>(() => {
      if (!normalizedQuery) {
        return {
          hasMoreResults: false,
          stations: defaultVisibleStations,
        };
      }

      const queryTokens = getSearchTokens(normalizedQuery);
      const topResults: StationSearchResult[] = [];
      let matchCount = 0;

      for (const searchableStation of searchableStations) {
        const score = getStationSearchScore(
          searchableStation,
          normalizedQuery,
          queryTokens,
        );

        if (score === null) {
          continue;
        }

        matchCount += 1;

        const result = {
          score,
          station: searchableStation.station,
          originalIndex: searchableStation.originalIndex,
        };
        let insertAt = topResults.findIndex((candidate) => {
          return compareStationSearchResults(result, candidate) < 0;
        });

        if (insertAt === -1) {
          insertAt = topResults.length;
        }

        if (insertAt >= MAX_VISIBLE_STATIONS) {
          continue;
        }

        topResults.splice(insertAt, 0, result);

        if (topResults.length > MAX_VISIBLE_STATIONS) {
          topResults.pop();
        }
      }

      return {
        hasMoreResults: matchCount > MAX_VISIBLE_STATIONS,
        stations: topResults.map((result) => result.station),
      };
    }, [defaultVisibleStations, normalizedQuery, searchableStations]);

  const groupedStations = visibleStations.reduce((groups, station) => {
    const regionLabel: StationGroupHeading =
      getStationRegion(station.region_id, station.station_id)?.label ?? "Other";
    const stationsInRegion = groups.get(regionLabel) ?? [];

    stationsInRegion.push(station);
    groups.set(regionLabel, stationsInRegion);

    return groups;
  }, new Map<StationGroupHeading, CitiBikeStation[]>());

  const visibleGroups = [...groupedStations.entries()]
    .sort(([labelA], [labelB]) => {
      const indexA =
        REGION_GROUP_INDEX.get(labelA) ?? REGION_GROUP_ORDER.length;
      const indexB =
        REGION_GROUP_INDEX.get(labelB) ?? REGION_GROUP_ORDER.length;

      return indexA - indexB || labelA.localeCompare(labelB);
    })
    .map(([label, stationsInRegion]) => ({
      heading: normalizedQuery
        ? `${label} (${hasMoreResults ? "showing first 50" : stationsInRegion.length})`
        : label,
      stations: stationsInRegion,
    }));

  useHotkey("Mod+K", () => setOpen(true));

  const handleSelectStation = (station: CitiBikeStation) => {
    onSelectStation(station);
    setQuery("");
    setOpen(false);
  };

  return (
    <div>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-9 md:w-auto"
      >
        <MagnifyingGlassIcon className="size-5 md:size-4" />
        <span className="hidden md:block">Search</span>
        <KbdGroup>
          <Kbd>⌘ K</Kbd>
        </KbdGroup>
      </Button>
      {useMobileSearch ? (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="max-h-[80vh]">
            <DrawerHeader className="gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <DrawerTitle className="text-left">Search stations</DrawerTitle>
                <DrawerClose asChild>
                  <CloseButton
                    className="-mr-1"
                    aria-label="Close station search"
                  />
                </DrawerClose>
              </div>
              <DrawerDescription className="sr-only text-left">
                Search by station name or short name.
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4">
              <Input
                type="search"
                placeholder="Search stations..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect="off"
                enterKeyHint="search"
                spellCheck={false}
              />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-6">
              <MobileStationSearchResults
                visibleGroups={visibleGroups}
                onSelectStation={handleSelectStation}
              />
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <CommandDialog open={open} onOpenChange={setOpen}>
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search stations..."
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              {visibleGroups.map((group) => (
                <CommandGroup key={group.heading} heading={group.heading}>
                  {group.stations.map((station) => (
                    <CommandItem
                      key={station.station_id}
                      value={station.name}
                      keywords={[station.short_name ?? ""].filter(Boolean)}
                      onSelect={() => handleSelectStation(station)}
                      hideCheckIcon
                    >
                      <StationSearchResultContent station={station} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </CommandDialog>
      )}
    </div>
  );
}
