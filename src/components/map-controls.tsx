import { BicycleIcon } from "@phosphor-icons/react/dist/csr/Bicycle";
import { useState } from "react";
import type { CitiBikeStation } from "#/lib/citibike";
import type { UserLocationState } from "#/lib/user-location";
import { cn } from "#/lib/utils";
import { CloseButton } from "./close-button";
import { MapSummary } from "./map-summary";
import { NearbyButton } from "./nearby-button";
import { StationSearch } from "./station-search";
import { Button } from "./ui/button";

interface MapControlsProps {
  stations: CitiBikeStation[];
  lastUpdated: number | undefined;
  onClearUserLocation: () => void;
  onSelectStation: (station: CitiBikeStation) => void;
  onRequestUserLocation: () => void;
  userLocation: UserLocationState;
}

export function MapControls({
  stations,
  lastUpdated,
  onClearUserLocation,
  onSelectStation,
  onRequestUserLocation,
  userLocation,
}: MapControlsProps) {
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  return (
    <div className="absolute top-3 right-3 left-3 z-10 md:right-auto">
      <div className="flex flex-row gap-1.5 md:grid md:grid-cols-1">
        <StationSearch
          stations={stations}
          onSelectStation={onSelectStation}
          userLocation={userLocation}
        />

        <NearbyButton
          userLocation={userLocation}
          onClearUserLocation={onClearUserLocation}
          onRequestUserLocation={onRequestUserLocation}
        />
        {stations.length > 0 ? (
          <Button
            size="icon"
            variant="outline"
            className="md:hidden"
            aria-expanded={isSummaryOpen}
            aria-label={isSummaryOpen ? "Hide map summary" : "Show map summary"}
            onClick={() => setIsSummaryOpen((open) => !open)}
          >
            <BicycleIcon className="size-4.5" />
          </Button>
        ) : null}
      </div>
      {stations.length > 0 ? (
        <MapSummary
          stations={stations}
          lastUpdated={lastUpdated}
          ariaHidden={!isSummaryOpen}
          className="absolute top-0 right-0 w-full md:hidden"
          open={isSummaryOpen}
          cardClassName={cn(
            "w-full will-change-transform bg-background/95 shadow-lg supports-[backdrop-filter]:bg-background/95",
          )}
          title="Map summary"
          action={
            isSummaryOpen ? (
              <CloseButton
                className="-mr-1 active:scale-[0.97]"
                aria-label="Close map summary"
                onClick={() => setIsSummaryOpen(false)}
              />
            ) : null
          }
        />
      ) : null}
    </div>
  );
}
