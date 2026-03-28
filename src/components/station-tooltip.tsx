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

function count(value: number | undefined): number {
  return value ?? 0;
}

function getIsActive(station: CitiBikeStation): boolean {
  return station.is_renting === 1 && station.is_installed === 1;
}

function getAvailabilityLevel(
  available: number,
  capacity: number,
): "empty" | "low" | "moderate" | "good" | "full" {
  if (capacity === 0) return "empty";
  const ratio = available / capacity;
  if (ratio === 0) return "empty";
  if (ratio <= 0.15) return "low";
  if (ratio <= 0.4) return "moderate";
  if (ratio >= 0.95) return "full";
  return "good";
}

const levelColors = {
  empty: "text-red-400",
  low: "text-amber-400",
  moderate: "text-white",
  good: "text-emerald-400",
  full: "text-emerald-400",
} as const;

export function StationTooltip({ station }: StationTooltipProps) {
  const bikes = count(station.num_bikes_available);
  const docks = count(station.num_docks_available);
  const ebikes = count(station.num_ebikes_available);
  const classicBikes = bikes - ebikes;
  const capacity = count(station.capacity);
  const disabled = count(station.num_bikes_disabled);
  const isActive = getIsActive(station);
  const lastReported = getRelativeTime(station.last_reported);
  const bikeLevel = getAvailabilityLevel(bikes, capacity);
  const dockLevel = getAvailabilityLevel(docks, capacity);
  const fillPct = capacity > 0 ? Math.round((bikes / capacity) * 100) : 0;
  const bikeRatio = capacity > 0 ? bikes / capacity : 0;
  const availabilityTone = stationAvailabilityTone(bikeRatio, isActive);
  const availabilityVars = {
    "--station-availability": availabilityTone.css,
  } as CSSProperties;

  return (
    <Card className="w-68" style={availabilityVars}>
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
        {isActive && (
          <div className="flex items-center gap-x-1.5">
            <BicycleIcon className="text-muted-foreground size-5" />
            <span className="text-muted-foreground">Available</span>
            <span className="ml-auto font-medium">{bikes}</span>
          </div>
        )}
        {isActive && (
          <div className="flex items-center gap-x-1.5">
            <ArrowBendDownRightIcon className="text-muted-foreground ml-2 size-5" />
            <LightningIcon className="text-muted-foreground size-5" />
            <span className="text-muted-foreground">Electric</span>
            <span className="ml-auto font-medium">{ebikes}</span>
          </div>
        )}
        {isActive && (
          <div className="flex items-center gap-x-1.5">
            <ArrowBendDownRightIcon className="text-muted-foreground ml-2 size-5" />
            <GearSixIcon className="text-muted-foreground size-5" />
            <span className="text-muted-foreground">Classic</span>
            <span className="ml-auto font-medium">{classicBikes}</span>
          </div>
        )}
        {isActive && (
          <div className="flex items-center gap-x-1.5">
            <LetterCirclePIcon className="text-muted-foreground size-5" />
            <span className="text-muted-foreground">Docks Open</span>
            <span className="ml-auto font-medium">{docks}</span>
          </div>
        )}
        {isActive && (
          <div className="flex items-center gap-x-1.5">
            <WrenchIcon className="text-muted-foreground size-5" />
            <span className="text-muted-foreground">Disabled</span>
            <span className="ml-auto font-medium">{disabled}</span>
          </div>
        )}
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
