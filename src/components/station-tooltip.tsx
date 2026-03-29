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
import { Badge } from "./ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Progress } from "./ui/progress";

interface StationTooltipProps {
  station: CitiBikeStation;
}

function count(value: number | undefined): number {
  return value ?? 0;
}

function getIsActive(station: CitiBikeStation): boolean {
  return station.is_renting === 1 && station.is_installed === 1;
}

function getRegionBadge(station: CitiBikeStation): {
  label: string;
  className: string;
} {
  switch (station.region_id) {
    case "70":
      return {
        label: "Jersey City",
        className:
          "border-emerald-500/25 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
      };
    case "311":
      return {
        label: "Hoboken",
        className:
          "border-amber-500/25 bg-amber-500/12 text-amber-700 dark:text-amber-300",
      };
    case "71":
      return {
        label: "NYC",
        className:
          "border-sky-500/25 bg-sky-500/12 text-sky-700 dark:text-sky-300",
      };
    default:
      return {
        label: "Region Unassigned",
        className: "border-border bg-muted text-muted-foreground",
      };
  }
}

function BikeBreakdownBar({
  electric,
  classic,
  total,
}: {
  electric: number;
  classic: number;
  total: number;
}) {
  if (total === 0) return null;

  const electricPct = Math.round((electric / total) * 100);

  return (
    <div className="space-y-1.5">
      <Progress
        value={electricPct}
        className="gap-0"
        trackClassName="h-1.5 bg-sky-400/80 dark:bg-sky-300/80"
        indicatorClassName="bg-amber-400 dark:bg-amber-300"
      />
      {/* legend row */}
      <div className="flex items-center gap-3 tabular-nums">
        {electric > 0 && (
          <span className="flex items-center gap-x-1.5">
            <LightningIcon
              weight="fill"
              className="size-4 text-amber-400 dark:text-amber-300"
            />
            <span className="text-muted-foreground">Electric</span>
            <span>{electric}</span>
          </span>
        )}
        {classic > 0 && (
          <span
            className={cn(
              "flex items-center gap-x-1.5",
              electric > 0 && "ml-auto flex-row-reverse",
            )}
          >
            <GearSixIcon className="size-4 text-sky-400 dark:text-sky-300" />
            <span className="text-muted-foreground">Classic</span>
            <span>{classic}</span>
          </span>
        )}
      </div>
    </div>
  );
}

/** Single stat row */
function StatRow({
  icon,
  label,
  value,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div
      className={cn("flex items-center gap-x-1.5 transition-colors", className)}
    >
      {icon}
      <span className="text-muted-foreground font-medium">{label}</span>
      <span className="ml-auto">{value}</span>
    </div>
  );
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

  const bikeRatio = capacity > 0 ? bikes / capacity : 0;
  const availabilityTone = stationAvailabilityTone(bikeRatio, isActive);
  const availabilityVars = {
    "--station-availability": availabilityTone.css,
  } as CSSProperties;
  const regionBadge = getRegionBadge(station);

  return (
    <Card
      className={cn("bg-popover w-72", !isActive && "bg-mist-800")}
      style={availabilityVars}
    >
      <CardHeader className="gap-1">
        <CardTitle className="min-w-0 text-balance">{station.name}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 text-sm tabular-nums">
        {isActive && (
          <>
            {/* Available bikes — primary stat with breakdown */}
            <div>
              <div className="flex items-center gap-x-1.5">
                <BicycleIcon className="text-muted-foreground size-4" />
                <span className="text-muted-foreground font-medium">
                  Available
                </span>
                <span className="ml-auto text-base font-bold tabular-nums">
                  {bikes}
                </span>
              </div>
              <BikeBreakdownBar
                electric={ebikes}
                classic={classicBikes}
                total={bikes}
              />
            </div>

            <div className="space-y-1.5">
              <StatRow
                icon={
                  <LetterCirclePIcon className="text-muted-foreground size-4" />
                }
                label="Open Docks"
                value={docks}
                className="hover:bg-muted/30"
              />
              {disabledBikes > 0 && (
                <StatRow
                  icon={<WrenchIcon className="text-muted-foreground size-4" />}
                  label="Disabled"
                  value={disabledBikes}
                  className="hover:bg-muted/30"
                />
              )}
            </div>
          </>
        )}

        {!isActive && capacity > 0 && (
          <StatRow
            icon={
              <ChargingStationIcon className="text-muted-foreground size-4" />
            }
            label="Capacity"
            value={capacity}
          />
        )}
      </CardContent>

      <CardFooter className="text-[11px] tabular-nums">
        <time dateTime={station.last_reported?.toString()}>
          Updated {lastReported}
        </time>
        <Badge
          variant="outline"
          className={cn(regionBadge.className, "ml-auto")}
          aria-label={`Region: ${regionBadge.label}`}
        >
          {regionBadge.label}
        </Badge>
      </CardFooter>
    </Card>
  );
}
