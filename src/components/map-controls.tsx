import { BicycleIcon } from "@phosphor-icons/react/dist/csr/Bicycle";
import { useState } from "react";
import type { CitiBikeStation } from "#/lib/citibike";
import { cn } from "#/lib/utils";
import { CloseButton } from "./close-button";
import { MapSummary } from "./map-summary";
import { StationSearch } from "./station-search";
import { Button } from "./ui/button";

interface MapControlsProps {
  stations: CitiBikeStation[];
  lastUpdated: number | undefined;
  onSelectStation: (station: CitiBikeStation) => void;
}

export function MapControls({
  stations,
  lastUpdated,
  onSelectStation,
}: MapControlsProps) {
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  return (
    <div className="pointer-events-none absolute top-3 right-3 left-3 z-10 md:right-auto">
      <div className="flex items-start gap-1.5">
        <div className="pointer-events-auto">
          <StationSearch
            stations={stations}
            onSelectStation={onSelectStation}
          />
        </div>
        {stations.length > 0 ? (
          <Button
            size="icon"
            variant="outline"
            className="pointer-events-auto active:scale-[0.97] md:hidden"
            aria-expanded={isSummaryOpen}
            aria-label={isSummaryOpen ? "Hide map summary" : "Show map summary"}
            onClick={() => setIsSummaryOpen((open) => !open)}
          >
            <BicycleIcon className="size-5" />
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
            "w-full will-change-transform bg-background/95 shadow-lg supports-[backdrop-filter]:bg-background/90",
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
