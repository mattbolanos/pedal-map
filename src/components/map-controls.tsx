import { BicycleIcon } from "@phosphor-icons/react/dist/csr/Bicycle";
import { ChartLineUpIcon } from "@phosphor-icons/react/dist/csr/ChartLineUp";
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
    <div className="absolute top-3 right-3 left-3 z-10 md:right-auto">
      <div className="grid w-fit grid-cols-2 grid-rows-2 gap-1.5 md:grid-cols-1">
        <StationSearch
          stations={stations}
          onSelectStation={onSelectStation}
          userLocation={userLocation}
        />
        <Button
          size="icon-lg"
          variant="outline"
          className="md:hidden"
          disabled={stations.length === 0}
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
          to="/insights"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "size-10 md:h-9 md:w-auto md:justify-start",
          )}
          aria-label="Open ride insights"
        >
          <ChartLineUpIcon className="size-5" />
          <span className="hidden md:inline">Insights</span>
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
