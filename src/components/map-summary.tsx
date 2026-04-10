import NumberFlow, { NumberFlowGroup } from "@number-flow/react";
import { BicycleIcon } from "@phosphor-icons/react/dist/csr/Bicycle";
import { ChargingStationIcon } from "@phosphor-icons/react/dist/csr/ChargingStation";
import { LetterCirclePIcon } from "@phosphor-icons/react/dist/csr/LetterCircleP";
import type { CitiBikeStation } from "#/lib/citibike";
import { BikeSplitBar } from "./bike-split-bar";
import { LastUpdated } from "./last-updated";
import { Card, CardContent } from "./ui/card";

interface MapSummaryProps {
  stations: CitiBikeStation[];
  lastUpdated: number | undefined;
}

function count(value: number | undefined): number {
  return value ?? 0;
}

export function MapSummary({ stations, lastUpdated }: MapSummaryProps) {
  const totalBikes = stations.reduce(
    (sum, station) => sum + count(station.num_bikes_available),
    0,
  );
  const totalEbikes = stations.reduce(
    (sum, station) => sum + count(station.num_ebikes_available),
    0,
  );
  const totalClassicBikes = Math.max(totalBikes - totalEbikes, 0);
  const totalParkingSpots = stations.reduce(
    (sum, station) => sum + count(station.num_docks_available),
    0,
  );

  return (
    <div className="pointer-events-none absolute top-3 right-3 z-10">
      <Card>
        <CardContent className="tabular-nums">
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
          <LastUpdated lastReported={lastUpdated} className="text-xs" />
        </CardContent>
      </Card>
    </div>
  );
}
