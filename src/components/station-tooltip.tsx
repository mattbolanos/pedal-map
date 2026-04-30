import { BicycleIcon } from "@phosphor-icons/react/dist/csr/Bicycle";
import { ChargingStationIcon } from "@phosphor-icons/react/dist/csr/ChargingStation";
import { LetterCirclePIcon } from "@phosphor-icons/react/dist/csr/LetterCircleP";
import { WrenchIcon } from "@phosphor-icons/react/dist/csr/Wrench";
import { Link } from "@tanstack/react-router";
import type { CitiBikeStation } from "#/lib/citibike";
import { isStationActive } from "#/lib/station";
import {
  availabilityColorCss,
  stationAvailabilityRatio,
} from "#/lib/station-pin";
import { getStationRegion } from "#/lib/station-region";
import { cn, getRelativeTime } from "#/lib/utils";
import { BikeSplitBar } from "./bike-split-bar";
import { CloseButton } from "./close-button";
import { Badge } from "./ui/badge";
import { Button, buttonVariants } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import {
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "./ui/drawer";
import { PopoverHeader } from "./ui/popover";

interface StationTooltipProps {
  station: CitiBikeStation;
}

interface StationPopoverPanelProps extends StationTooltipProps {
  onClose?: () => void;
}

function count(value: number | undefined): number {
  return value ?? 0;
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
    <div className={cn("flex items-center gap-x-1.5", className)}>
      {icon}
      <span>{label}</span>
      <span className="ml-auto tabular-nums">{value}</span>
    </div>
  );
}

function StationNameLink({
  station,
  className,
  onClick,
}: StationTooltipProps & {
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      to="/stations/$id"
      params={{ id: station.station_id }}
      onClick={onClick}
      aria-label={`View ${station.name} station profile`}
      className={buttonVariants({
        variant: "text-link",
        size: "text-link",
        className,
      })}
    >
      {station.name}
    </Link>
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
  const ratio = stationAvailabilityRatio(bikes, capacity);
  const pct = Math.round(ratio * 100);

  return (
    <div className={cn("space-y-1.5 text-sm tabular-nums", className)}>
      {isActive ? (
        <>
          <div className="space-y-1.5">
            <div className="flex items-center gap-x-1.5">
              <BicycleIcon className="text-muted-foreground size-4" />
              {bikes > 0 ? (
                <span
                  className="font-medium tabular-nums"
                  style={{ color: availabilityColorCss(ratio, isActive) }}
                >
                  {pct}% Available
                </span>
              ) : (
                <span
                  className="font-medium"
                  style={{ color: availabilityColorCss(0, isActive) }}
                >
                  Available
                </span>
              )}
              <span className="ml-auto tabular-nums">{bikes}</span>
            </div>
            <BikeSplitBar
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
        className="text-muted-foreground text-[11px] tabular-nums"
      >
        Updated {getRelativeTime(station.last_reported)}
      </time>
    </div>
  );
}

function StationBadges({ station }: StationTooltipProps) {
  const regionBadge = getStationRegion(station.region_id, station.station_id);
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
  <Card className="bg-popover supports-backdrop-filter:bg-popover/95 md:w-72">
    <CardHeader className="gap-2">
      <StationNameLink
        station={station}
        className="min-w-0 text-base text-balance"
      />
      <StationBadges station={station} />
    </CardHeader>
    <CardContent className="p-0">
      <StationDetails station={station} className="px-4 pb-4" />
    </CardContent>
  </Card>
);

export const StationPopoverPanel = ({
  station,
  onClose,
}: StationPopoverPanelProps) => (
  <div className="flex w-full flex-col gap-3">
    <div className="flex items-start justify-between gap-2">
      <PopoverHeader className="min-w-0 flex-1 gap-2">
        <StationNameLink
          station={station}
          onClick={onClose}
          className="min-w-0 text-sm text-balance"
        />
        <StationBadges station={station} />
      </PopoverHeader>
      {onClose ? (
        <CloseButton
          className="-mt-1 -mr-1 shrink-0"
          onClick={onClose}
          aria-label="Close station details"
        />
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
          <CloseButton className="-mr-1" aria-label="Close station details" />
        </DrawerClose>
      </div>
      <StationBadges station={station} />
      <DrawerDescription className="sr-only">Station details</DrawerDescription>
    </DrawerHeader>
    <div className="space-y-3 px-4">
      <StationDetails station={station} />
    </div>
    <DrawerFooter className="pb-0">
      <Link
        to="/stations/$id"
        params={{ id: station.station_id }}
        aria-label={`View ${station.name} station profile`}
        className={buttonVariants({ variant: "foreground" })}
      >
        Open Station Profile
      </Link>
      <DrawerClose>
        <Button className="w-full" variant="secondary">
          Close
        </Button>
      </DrawerClose>
    </DrawerFooter>
  </DrawerContent>
);
