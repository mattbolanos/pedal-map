import { BicycleIcon } from "@phosphor-icons/react/dist/csr/Bicycle";
import { ChargingStationIcon } from "@phosphor-icons/react/dist/csr/ChargingStation";
import { InfoIcon } from "@phosphor-icons/react/dist/csr/Info";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import type { CitiBikeStation } from "#/lib/citibike";
import type { UserLocationState } from "#/lib/user-location";
import { cn } from "#/lib/utils";
import { CloseButton } from "./close-button";
import { MapSummary } from "./map-summary";
import { NearbyButton } from "./nearby-button";
import { StationSearch } from "./station-search";
import { Button, buttonVariants } from "./ui/button";

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
    <div className="absolute top-3 right-3 left-2 z-10 md:right-auto md:left-3">
      <div className="grid w-fit grid-cols-1 gap-1.5">
        <StationSearch
          stations={stations}
          onSelectStation={onSelectStation}
          userLocation={userLocation}
        />
        <Button
          size="icon-lg"
          variant="outline"
          className="md:hidden"
          aria-expanded={isSummaryOpen}
          aria-label={isSummaryOpen ? "Hide map summary" : "Show map summary"}
          onClick={() => setIsSummaryOpen((open) => !open)}
        >
          <BicycleIcon className="size-5" />
        </Button>
        <NearbyButton
          userLocation={userLocation}
          onClearUserLocation={onClearUserLocation}
          onRequestUserLocation={onRequestUserLocation}
        />
        <Link
          to="/stations"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "size-10 md:h-9 md:w-auto md:justify-start",
          )}
          aria-label="Open stations page"
        >
          <ChargingStationIcon className="size-5 md:size-4" />
          <span className="hidden md:inline">Stations</span>
        </Link>
        <Link
          to="/about"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "size-10 md:h-9 md:w-auto md:justify-start",
          )}
          aria-label="Open about page"
        >
          <InfoIcon className="size-5 md:size-4" />
          <span className="hidden md:inline">About</span>
        </Link>
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
