import NumberFlow, { NumberFlowGroup } from "@number-flow/react";
import { BicycleIcon } from "@phosphor-icons/react/dist/csr/Bicycle";
import { ChargingStationIcon } from "@phosphor-icons/react/dist/csr/ChargingStation";
import { LetterCirclePIcon } from "@phosphor-icons/react/dist/csr/LetterCircleP";
import type { ReactNode } from "react";
import type { CitiBikeStation } from "#/lib/citibike";
import { cn } from "#/lib/utils";
import { BikeSplitBar } from "./bike-split-bar";
import { LastUpdated } from "./last-updated";
import { Card, CardContent } from "./ui/card";

interface MapSummaryProps {
  stations: CitiBikeStation[];
  lastUpdated: number | undefined;
  ariaHidden?: boolean;
  className?: string;
  cardClassName?: string;
  contentClassName?: string;
  title?: string;
  action?: ReactNode;
  open?: boolean;
}

function count(value: number | undefined): number {
  return value ?? 0;
}

const SUMMARY_FADE_TRANSITION =
  "transition-opacity motion-reduce:transition-none";

export function MapSummary({
  stations,
  lastUpdated,
  ariaHidden,
  className,
  cardClassName,
  contentClassName,
  title,
  action,
  open,
}: MapSummaryProps) {
  if (stations.length === 0) return null;

  const { totalBikes, totalEbikes, totalParkingSpots } = stations.reduce(
    (totals, station) => {
      totals.totalBikes += count(station.num_bikes_available);
      totals.totalEbikes += count(station.num_ebikes_available);
      totals.totalParkingSpots += count(station.num_docks_available);

      return totals;
    },
    { totalBikes: 0, totalEbikes: 0, totalParkingSpots: 0 },
  );
  const totalClassicBikes = Math.max(totalBikes - totalEbikes, 0);

  return (
    <div
      aria-hidden={ariaHidden}
      className={cn("pointer-events-none fixed top-3 right-3 z-50", className)}
    >
      <Card
        className={cn(
          "pointer-events-auto",
          open !== undefined && [
            SUMMARY_FADE_TRANSITION,
            open
              ? "opacity-100 motion-safe:duration-180 motion-safe:ease-out"
              : "pointer-events-none opacity-0 duration-0",
          ],
          cardClassName,
        )}
      >
        <CardContent
          className={cn(
            "tabular-nums",
            open !== undefined && [
              SUMMARY_FADE_TRANSITION,
              open
                ? "opacity-100 motion-safe:duration-180 motion-safe:ease-out"
                : "opacity-0 duration-0",
            ],
            contentClassName,
          )}
        >
          {title || action ? (
            <div className="mb-3 flex items-start justify-between gap-2">
              {title ? (
                <h2 className="text-sm font-medium">{title}</h2>
              ) : (
                <div />
              )}
              {action}
            </div>
          ) : null}
          <NumberFlowGroup>
            <div className="flex items-center gap-x-1.5">
              <BicycleIcon className="text-muted-foreground size-5" />
              <span>Bikes</span>
              <NumberFlow
                value={totalBikes}
                locales="en-US"
                trend={0}
                className="ml-auto"
              />
            </div>
            <div className="flex items-center gap-x-1.5">
              <LetterCirclePIcon className="text-muted-foreground size-5" />
              <span>Open Docks</span>
              <NumberFlow
                value={totalParkingSpots}
                locales="en-US"
                trend={0}
                className="ml-auto"
              />
            </div>
            <div className="flex items-center gap-x-1.5">
              <ChargingStationIcon className="text-muted-foreground size-5" />
              <span>Stations</span>
              <NumberFlow
                value={stations.length}
                locales="en-US"
                trend={0}
                className="ml-auto"
              />
            </div>
          </NumberFlowGroup>
          <BikeSplitBar
            total={totalBikes}
            electric={totalEbikes}
            className="[&_svg]:size-5"
            classic={totalClassicBikes}
          />
          <LastUpdated
            lastReported={lastUpdated}
            className="text-muted-foreground text-xs"
          />
        </CardContent>
      </Card>
    </div>
  );
}
