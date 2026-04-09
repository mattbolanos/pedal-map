import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { MapPinAreaIcon } from "@phosphor-icons/react/dist/csr/MapPinArea";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useDeferredValue, useState } from "react";
import type { CitiBikeStation } from "#/lib/citibike";
import { getStationRegion } from "#/lib/station-region";
import { cn } from "#/lib/utils";
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
import { Kbd, KbdGroup } from "./ui/kbd";

const DEFAULT_VISIBLE_STATIONS = 30;

interface StationSearchProps {
  stations: CitiBikeStation[];
  onSelectStation: (station: CitiBikeStation) => void;
}

export function StationSearch({
  stations,
  onSelectStation,
}: StationSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const visibleStations = normalizedQuery
    ? stations.filter((station) =>
        [station.name, station.short_name, station.station_id].some((value) =>
          value?.toLowerCase().includes(normalizedQuery),
        ),
      )
    : stations.slice(0, DEFAULT_VISIBLE_STATIONS);

  useHotkey("Mod+K", () => setOpen(true));

  return (
    <div>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <MagnifyingGlassIcon />
        Search
        <KbdGroup>
          <Kbd>⌘ K</Kbd>
        </KbdGroup>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);

          if (!nextOpen) {
            setQuery("");
          }
        }}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search stations..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup
              heading={
                normalizedQuery
                  ? `Stations (${visibleStations.length})`
                  : `Stations (${visibleStations.length} of ${stations.length})`
              }
            >
              {visibleStations.map((station) => {
                const region = getStationRegion(station.region_id);

                return (
                  <CommandItem
                    key={station.station_id}
                    value={station.name}
                    keywords={[station.short_name ?? ""].filter(Boolean)}
                    onSelect={() => {
                      onSelectStation(station);
                      setQuery("");
                      setOpen(false);
                    }}
                  >
                    <MapPinAreaIcon
                      className={cn("size-4 shrink-0", region?.pinClassName)}
                    />
                    <span className="truncate">{station.name}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </div>
  );
}
