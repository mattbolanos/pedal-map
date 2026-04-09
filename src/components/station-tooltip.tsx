import { BicycleIcon } from "@phosphor-icons/react/dist/csr/Bicycle";
import { ChargingStationIcon } from "@phosphor-icons/react/dist/csr/ChargingStation";
import { GearSixIcon } from "@phosphor-icons/react/dist/csr/GearSix";
import { LetterCirclePIcon } from "@phosphor-icons/react/dist/csr/LetterCircleP";
import { LightningIcon } from "@phosphor-icons/react/dist/csr/Lightning";
import { WrenchIcon } from "@phosphor-icons/react/dist/csr/Wrench";
import { XIcon } from "@phosphor-icons/react/dist/csr/X";
import type { CitiBikeStation } from "#/lib/citibike";
import { isStationActive } from "#/lib/station";
import { availabilityColorCss } from "#/lib/station-pin";
import { getStationRegion } from "#/lib/station-region";
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
import { PopoverHeader } from "./ui/popover";
import { Progress } from "./ui/progress";

interface StationTooltipProps {
  station: CitiBikeStation;
}

interface StationPopoverPanelProps extends StationTooltipProps {
  onClose?: () => void;
}

function count(value: number | undefined): number {
  return value ?? 0;
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
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto">{value}</span>
    </div>
  );
}

function StationDetails({
  station,
  className,
}: StationTooltipProps & { className?: string }) {
  const bikes = count(station.num_bikes_available);
  const docks = count(station.num_docks_available);
  const ebikes = count(station.num_ebikes_available);
  const classicBikes = bikes - ebikes;
  const capacity = count(station.capacity);
  const disabledBikes = count(station.num_bikes_disabled);
  const isActive = isStationActive(station);
  const lastReported = getRelativeTime(station.last_reported);
  const ratio = capacity > 0 ? bikes / capacity : 0;
  const pct = Math.round(ratio * 100);

  return (
    <div className={cn("space-y-3 text-sm tabular-nums", className)}>
      {isActive ? (
        <>
          <div className="space-y-1.5">
            <div className="flex items-center gap-x-1.5">
              <BicycleIcon className="text-muted-foreground size-4" />
              {bikes > 0 && (
                <span
                  className="font-medium tabular-nums"
                  style={{ color: availabilityColorCss(ratio, isActive) }}
                >
                  {pct}%
                </span>
              )}
              <span className="text-muted-foreground">Available</span>

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

function StationBadges({ station }: StationTooltipProps) {
  const regionBadge = getStationRegion(station.region_id);
  const isActive = isStationActive(station);

  if (!regionBadge && isActive) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {regionBadge ? (
        <Badge
          variant={regionBadge.badgeVariant}
          aria-label={`Region: ${regionBadge.label}`}
        >
          {regionBadge.label}
        </Badge>
      ) : null}
      {!isActive ? (
        <Badge variant="offline" aria-label="Offline">
          Offline
        </Badge>
      ) : null}
    </div>
  );
}

export const StationTooltip = ({ station }: StationTooltipProps) => (
  <Card className="bg-popover supports-backdrop-filter:bg-popover/95 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:slide-in-from-bottom-2 motion-safe:duration-200 md:w-72">
    <CardHeader className="gap-1.5">
      <CardTitle className="min-w-0 text-balance">{station.name}</CardTitle>
      <StationBadges station={station} />
    </CardHeader>
    <CardContent className="p-0">
      <StationDetails station={station} className="px-4" />
    </CardContent>
  </Card>
);

export const StationPopoverPanel = ({
  station,
  onClose,
}: StationPopoverPanelProps) => (
  <div className="flex w-full flex-col gap-3">
    <div className="flex items-start justify-between gap-2">
      <PopoverHeader className="min-w-0 flex-1 gap-1.5">
        <h3 className="min-w-0 text-sm font-medium text-balance">
          {station.name}
        </h3>
        <StationBadges station={station} />
      </PopoverHeader>
      {onClose ? (
        <Button
          size="icon-sm"
          variant="secondary"
          className="-mt-1 -mr-1 shrink-0"
          onClick={onClose}
          aria-label="Close station details"
        >
          <XIcon />
        </Button>
      ) : null}
    </div>
    <StationDetails station={station} />
  </div>
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
        <StationBadges station={station} />
      </DrawerDescription>
    </DrawerHeader>
    <StationDetails station={station} className="px-4" />
  </DrawerContent>
);
