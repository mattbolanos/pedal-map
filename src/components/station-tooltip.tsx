import { BicycleIcon } from "@phosphor-icons/react/dist/csr/Bicycle";
import { ChargingStationIcon } from "@phosphor-icons/react/dist/csr/ChargingStation";
import { GearSixIcon } from "@phosphor-icons/react/dist/csr/GearSix";
import { LetterCirclePIcon } from "@phosphor-icons/react/dist/csr/LetterCircleP";
import { LightningIcon } from "@phosphor-icons/react/dist/csr/Lightning";
import { WrenchIcon } from "@phosphor-icons/react/dist/csr/Wrench";
import { XIcon } from "@phosphor-icons/react/dist/csr/X";
import type { CitiBikeStation } from "#/lib/citibike";
import { getNeighborhoodBucketMeta } from "#/lib/neighborhood-bucket";
import { availabilityColorCss } from "#/lib/station-pin";
import { cn, getRelativeTime } from "#/lib/utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "./ui/drawer";
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

function StationDetails({ station }: StationTooltipProps) {
  const bikes = count(station.num_bikes_available);
  const docks = count(station.num_docks_available);
  const ebikes = count(station.num_ebikes_available);
  const classicBikes = bikes - ebikes;
  const capacity = count(station.capacity);
  const disabledBikes = count(station.num_bikes_disabled);
  const isActive = getIsActive(station);
  const lastReported = getRelativeTime(station.last_reported);
  const ratio = capacity > 0 ? bikes / capacity : 0;
  const pct = Math.round(ratio * 100);

  return (
    <div className="space-y-3 px-4 text-sm tabular-nums">
      {isActive ? (
        <>
          <div className="space-y-1.5">
            <div className="flex items-center gap-x-1.5">
              <BicycleIcon className="text-muted-foreground size-4" />
              {bikes > 0 && (
                <span
                  className="tabular-nums"
                  style={{ color: availabilityColorCss(ratio, isActive) }}
                >
                  {pct}%
                </span>
              )}
              <span className="text-muted-foreground font-medium">
                Available
              </span>

              <span className="ml-auto tabular-nums">{bikes}</span>
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
            />
            {disabledBikes > 0 && (
              <StatRow
                icon={<WrenchIcon className="text-muted-foreground size-4" />}
                label="Disabled"
                value={disabledBikes}
              />
            )}
          </div>
        </>
      ) : (
        capacity > 0 && (
          <StatRow
            icon={
              <ChargingStationIcon className="text-muted-foreground size-4" />
            }
            label="Capacity"
            value={capacity}
          />
        )
      )}

      <time
        dateTime={station.last_reported?.toString()}
        className="text-[11px] tabular-nums"
      >
        Updated {lastReported}
      </time>
    </div>
  );
}

export const StationTooltip = ({ station }: StationTooltipProps) => (
  <Card className="bg-popover md:w-72">
    <CardHeader className="gap-1.5">
      <CardTitle className="min-w-0 text-balance">{station.name}</CardTitle>
      <div className="flex items-center gap-2">
        <Badge
          variant={station.neighborhoodBucket}
          aria-label={`Neighborhood: ${station.neighborhoodBucket}`}
        >
          {getNeighborhoodBucketMeta(station.neighborhoodBucket).label}
        </Badge>
        {!getIsActive(station) && (
          <Badge variant="offline" aria-label="Offline">
            Offline
          </Badge>
        )}
      </div>
    </CardHeader>
    <CardContent className="p-0">
      <StationDetails station={station} />
    </CardContent>
  </Card>
);

export const StationDrawer = ({ station }: StationTooltipProps) => (
  <DrawerContent className="pb-5">
    <DrawerHeader className="gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <DrawerTitle className="line-clamp-1 text-left text-base text-pretty">
          {station.name}
        </DrawerTitle>
        <DrawerClose asChild>
          <Button size="icon-sm" variant="secondary" className="-mr-1">
            <XIcon />
          </Button>
        </DrawerClose>
      </div>
      <DrawerDescription className="text-left">
        <span className="sr-only">Station details</span>
        <Badge
          variant={station.neighborhoodBucket}
          aria-label={`Neighborhood: ${station.neighborhoodBucket}`}
        >
          {getNeighborhoodBucketMeta(station.neighborhoodBucket).label}
        </Badge>
        {!getIsActive(station) && (
          <Badge variant="offline" aria-label="Offline" className="ml-2">
            Offline
          </Badge>
        )}
      </DrawerDescription>
    </DrawerHeader>
    <StationDetails station={station} />
  </DrawerContent>
);
