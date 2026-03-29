import { ArrowBendDownRightIcon } from "@phosphor-icons/react/dist/csr/ArrowBendDownRight";
import { BicycleIcon } from "@phosphor-icons/react/dist/csr/Bicycle";
import { ChargingStationIcon } from "@phosphor-icons/react/dist/csr/ChargingStation";
import { GearSixIcon } from "@phosphor-icons/react/dist/csr/GearSix";
import { LetterCirclePIcon } from "@phosphor-icons/react/dist/csr/LetterCircleP";
import { LightningIcon } from "@phosphor-icons/react/dist/csr/Lightning";
import { WrenchIcon } from "@phosphor-icons/react/dist/csr/Wrench";
import type { CSSProperties } from "react";
import type { CitiBikeStation } from "#/lib/citibike";
import { stationAvailabilityTone } from "#/lib/station-pin";
import { cn, getRelativeTime } from "#/lib/utils";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Progress, ProgressLabel, ProgressValue } from "./ui/progress";

interface StationTooltipProps {
  station: CitiBikeStation;
}

interface StationItem {
  icon: React.ReactNode;
  title: string;
  value: number;
  child?: boolean;
}

function count(value: number | undefined): number {
  return value ?? 0;
}

function getIsActive(station: CitiBikeStation): boolean {
  return station.is_renting === 1 && station.is_installed === 1;
}

export function StationTooltip({ station }: StationTooltipProps) {
  const bikes = count(station.num_bikes_available);
  const docks = count(station.num_docks_available);
  const ebikes = count(station.num_ebikes_available);
  const classicBikes = bikes - ebikes;
  const capacity = count(station.capacity);
  const disabledBikes = count(station.num_bikes_disabled);
  const isActive = getIsActive(station);
  const lastReported = getRelativeTime(station.last_reported);

  const fillPct = capacity > 0 ? Math.round((bikes / capacity) * 100) : 0;
  const bikeRatio = capacity > 0 ? bikes / capacity : 0;
  const availabilityTone = stationAvailabilityTone(bikeRatio, isActive);
  const availabilityVars = {
    "--station-availability": availabilityTone.css,
  } as CSSProperties;

  const STATION_ITEMS: StationItem[] = [
    {
      icon: <BicycleIcon className="text-muted-foreground size-5" />,
      title: "Available",
      value: bikes,
    },
    {
      icon: <LightningIcon className="text-muted-foreground size-5" />,
      title: "Electric",
      value: ebikes,
      child: true,
    },
    {
      icon: <GearSixIcon className="text-muted-foreground size-5" />,
      title: "Classic",
      value: classicBikes,
      child: true,
    },
    {
      icon: <LetterCirclePIcon className="text-muted-foreground size-5" />,
      title: "Docks Open",
      value: docks,
    },
    {
      icon: <WrenchIcon className="text-muted-foreground size-5" />,
      title: "Disabled",
      value: disabledBikes,
    },
  ];

  return (
    <Card className="bg-popover w-68" style={availabilityVars}>
      <CardHeader>
        <CardTitle>{station.name}</CardTitle>
        {isActive && (
          <Progress
            value={fillPct}
            className="w-full max-w-sm"
            trackClassName="border border-[var(--station-availability)]"
            indicatorClassName="bg-[var(--station-availability)]"
          >
            <ProgressLabel>Available bikes</ProgressLabel>
            <ProgressValue />
          </Progress>
        )}
      </CardHeader>
      <CardContent className="space-y-2 tabular-nums">
        {isActive &&
          STATION_ITEMS.map((item) => (
            <div key={item.title} className="flex items-center gap-x-1.5">
              {item.child && (
                <ArrowBendDownRightIcon className="text-muted-foreground size-5" />
              )}
              {item.icon}
              <span className="text-muted-foreground">{item.title}</span>
              <span className="ml-auto font-medium">{item.value}</span>
            </div>
          ))}
        <div
          className={cn(
            "flex items-center gap-x-1.5",
            isActive && "border-border border-t pt-2",
          )}
        >
          <ChargingStationIcon className="text-muted-foreground size-5" />
          <span className="text-muted-foreground">Capacity</span>
          <span className="ml-auto font-medium">{capacity}</span>
        </div>
      </CardContent>
      <CardFooter className="text-muted-foreground text-[11px] italic tabular-nums">
        <time dateTime={station.last_reported?.toString()}>
          Last updated: {lastReported}
        </time>
      </CardFooter>
    </Card>
  );
}
