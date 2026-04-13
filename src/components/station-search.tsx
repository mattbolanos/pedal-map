import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { MapPinAreaIcon } from "@phosphor-icons/react/dist/csr/MapPinArea";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useDeferredValue, useMemo, useState } from "react";
import { useIsMobile } from "#/hooks/use-mobile";
import { useIsTouchDevice } from "#/hooks/use-touch-device";
import type { CitiBikeStation } from "#/lib/citibike";
import {
  formatDistance,
  type GeoCoordinates,
  getDistanceBetweenCoordinates,
} from "#/lib/geo";
import { isStationActive } from "#/lib/station";
import {
  getStationRegion,
  type StationRegionLabel,
} from "#/lib/station-region";
import {
  hasActiveUserLocation,
  type UserLocationState,
} from "#/lib/user-location";
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
const MAX_NEARBY_STATIONS = 8;
const SEARCH_SEPARATOR_PATTERN = /[^a-z0-9]+/g;

type StationGroupHeading = StationRegionLabel | "Other";

interface SearchableStation {
  originalIndex: number;
  searchableText: string;
  searchableTokens: string[];
  station: CitiBikeStation;
}

interface StationSearchResult {
  distanceMeters: number | null;
  originalIndex: number;
  score: number;
  station: CitiBikeStation;
}

interface VisibleGroup {
  heading: string;
  stations: CitiBikeStation[];
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
  userLocation: UserLocationState;
}

interface StationSearchResultsProps {
  distanceLabelsByStationId: Map<string, string>;
  onSelectStation: (station: CitiBikeStation) => void;
  visibleGroups: VisibleGroup[];
}

function compareStationSearchResults(
  resultA: StationSearchResult,
  resultB: StationSearchResult,
) {
  const distanceA = resultA.distanceMeters ?? Number.POSITIVE_INFINITY;
  const distanceB = resultB.distanceMeters ?? Number.POSITIVE_INFINITY;

  return (
    resultB.score - resultA.score ||
    distanceA - distanceB ||
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

function getStationCoordinates(station: CitiBikeStation): GeoCoordinates {
  return {
    lat: station.lat,
    lon: station.lon,
  };
}

function buildRegionGroups(
  stations: CitiBikeStation[],
  normalizedQuery: string,
) {
  const groupedStations = stations.reduce((groups, station) => {
    const regionLabel: StationGroupHeading =
      getStationRegion(station.region_id, station.station_id)?.label ?? "Other";
    const stationsInRegion = groups.get(regionLabel) ?? [];

    stationsInRegion.push(station);
    groups.set(regionLabel, stationsInRegion);

    return groups;
  }, new Map<StationGroupHeading, CitiBikeStation[]>());

  return [...groupedStations.entries()]
    .sort(([labelA], [labelB]) => {
      const indexA =
        REGION_GROUP_INDEX.get(labelA) ?? REGION_GROUP_ORDER.length;
      const indexB =
        REGION_GROUP_INDEX.get(labelB) ?? REGION_GROUP_ORDER.length;

      return indexA - indexB || labelA.localeCompare(labelB);
    })
    .map(([label, stationsInRegion]) => ({
      heading: normalizedQuery
        ? `${label} (${stationsInRegion.length})`
        : label,
      stations: stationsInRegion,
    }));
}

function StationSearchResultContent({
  distanceLabel,
  station,
}: {
  distanceLabel?: string;
  station: CitiBikeStation;
}) {
  const region = getStationRegion(station.region_id, station.station_id);
  const isActive = isStationActive(station);

  return (
    <>
      <MapPinAreaIcon className={cn("shrink-0", region?.pinClassName)} />
      <span className="min-w-0 flex-1 truncate">{station.name}</span>
      {(distanceLabel || !isActive) && (
        <div className="ml-auto flex shrink-0 items-center gap-2 pl-3">
          {distanceLabel ? (
            <span className="text-muted-foreground text-xs tabular-nums">
              {distanceLabel}
            </span>
          ) : null}
          {!isActive ? (
            <Badge variant="offline" aria-label="Offline">
              Offline
            </Badge>
          ) : null}
        </div>
      )}
    </>
  );
}

function MobileStationSearchResults({
  distanceLabelsByStationId,
  onSelectStation,
  visibleGroups,
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
              <StationSearchResultContent
                distanceLabel={distanceLabelsByStationId.get(
                  station.station_id,
                )}
                station={station}
              />
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
  userLocation,
}: StationSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const isMobile = useIsMobile();
  const isTouchDevice = useIsTouchDevice();
  const useMobileSearch = isMobile || isTouchDevice;
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = normalizeSearchText(deferredQuery);
  const activeUserCoordinates = hasActiveUserLocation(userLocation)
    ? userLocation.coords
    : null;

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

  const stationDistanceMetersById = useMemo(() => {
    if (!activeUserCoordinates) {
      return new Map<string, number>();
    }

    return new Map(
      stations.map((station) => [
        station.station_id,
        getDistanceBetweenCoordinates(
          activeUserCoordinates,
          getStationCoordinates(station),
        ),
      ]),
    );
  }, [activeUserCoordinates, stations]);

  const distanceLabelsByStationId = useMemo(
    () =>
      new Map(
        [...stationDistanceMetersById.entries()]
          .map(([stationId, distanceMeters]) => [
            stationId,
            formatDistance(distanceMeters),
          ])
          .filter((entry): entry is [string, string] => entry[1] !== null),
      ),
    [stationDistanceMetersById],
  );

  const nearbyStations = useMemo(() => {
    if (!activeUserCoordinates) {
      return [];
    }

    return [...stations]
      .sort((stationA, stationB) => {
        const distanceA =
          stationDistanceMetersById.get(stationA.station_id) ??
          Number.POSITIVE_INFINITY;
        const distanceB =
          stationDistanceMetersById.get(stationB.station_id) ??
          Number.POSITIVE_INFINITY;

        return (
          distanceA - distanceB ||
          (stationB.num_ebikes_available ?? 0) -
            (stationA.num_ebikes_available ?? 0)
        );
      })
      .slice(0, MAX_NEARBY_STATIONS);
  }, [activeUserCoordinates, stationDistanceMetersById, stations]);

  const nearbyStationIds = useMemo(
    () => new Set(nearbyStations.map((station) => station.station_id)),
    [nearbyStations],
  );

  const defaultVisibleStations = useMemo(
    () =>
      [...stations]
        .sort(
          (stationA, stationB) =>
            (stationB.num_ebikes_available ?? 0) -
            (stationA.num_ebikes_available ?? 0),
        )
        .filter((station) => !nearbyStationIds.has(station.station_id))
        .slice(0, Math.max(MAX_VISIBLE_STATIONS - nearbyStations.length, 0)),
    [nearbyStationIds, nearbyStations.length, stations],
  );

  const defaultVisibleGroups = useMemo(() => {
    const groups: VisibleGroup[] = [];

    if (nearbyStations.length > 0) {
      groups.push({
        heading: "Nearby",
        stations: nearbyStations,
      });
    }

    groups.push(...buildRegionGroups(defaultVisibleStations, ""));

    return groups;
  }, [defaultVisibleStations, nearbyStations]);

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
          distanceMeters:
            stationDistanceMetersById.get(
              searchableStation.station.station_id,
            ) ?? null,
          originalIndex: searchableStation.originalIndex,
          score,
          station: searchableStation.station,
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
    }, [
      defaultVisibleStations,
      normalizedQuery,
      searchableStations,
      stationDistanceMetersById,
    ]);

  const visibleGroups = useMemo(() => {
    if (!normalizedQuery) {
      return defaultVisibleGroups;
    }

    return buildRegionGroups(
      visibleStations,
      hasMoreResults ? "showing first 50" : normalizedQuery,
    ).map((group) => ({
      ...group,
      heading: hasMoreResults
        ? `${group.heading.replace(/\s+\(.+\)$/, "")} (showing first 50)`
        : group.heading,
    }));
  }, [defaultVisibleGroups, hasMoreResults, normalizedQuery, visibleStations]);

  useHotkey("Mod+K", () => setOpen(true));

  const handleSelectStation = (station: CitiBikeStation) => {
    onSelectStation(station);
    setQuery("");
    setOpen(false);
  };

  return (
    <div>
      <Button
        aria-label="Search stations"
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-9 md:w-auto"
      >
        <MagnifyingGlassIcon className="size-4.5 md:size-4" />
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
                distanceLabelsByStationId={distanceLabelsByStationId}
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
                      <StationSearchResultContent
                        distanceLabel={distanceLabelsByStationId.get(
                          station.station_id,
                        )}
                        station={station}
                      />
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
