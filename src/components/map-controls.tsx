import { BicycleIcon } from "@phosphor-icons/react/dist/csr/Bicycle";
import { ChargingStationIcon } from "@phosphor-icons/react/dist/csr/ChargingStation";
import { CrosshairSimpleIcon } from "@phosphor-icons/react/dist/csr/CrosshairSimple";
import { InfoIcon } from "@phosphor-icons/react/dist/csr/Info";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { PlusIcon } from "@phosphor-icons/react/dist/csr/Plus";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import type { CitiBikeStation } from "#/lib/citibike";
import {
  getUserLocationToast,
  hasActiveUserLocation,
  type UserLocationState,
} from "#/lib/user-location";
import { cn } from "#/lib/utils";
import { CloseButton } from "./close-button";
import { MapSummary } from "./map-summary";
import { NearbyButton } from "./nearby-button";
import { StationSearch } from "./station-search";
import { Button, buttonVariants } from "./ui/button";
import { Kbd, KbdGroup } from "./ui/kbd";
import {
  SpeedDial,
  SpeedDialAction,
  SpeedDialContent,
  SpeedDialItem,
  SpeedDialLabel,
  SpeedDialTrigger,
} from "./ui/speed-dial";

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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const navigate = useNavigate();
  const hasActiveLocation = hasActiveUserLocation(userLocation);
  const locationToastVariant = getUserLocationToast(userLocation)?.variant;

  const nearbyLabel = hasActiveLocation
    ? "Turn off current location"
    : userLocation.status === "granted" && !userLocation.isInServiceArea
      ? "Clear your current location outside the Citi Bike service area"
      : "Use your current location";

  const handleNearbyAction =
    userLocation.status === "granted"
      ? onClearUserLocation
      : onRequestUserLocation;

  return (
    <>
      <div className="absolute top-3 right-3 left-3 z-10 md:right-auto md:left-3">
        <div className="fixed top-3 left-3 z-10 md:hidden">
          <SpeedDial side="bottom">
            <SpeedDialContent align="start">
              <SpeedDialItem>
                <SpeedDialAction
                  aria-label="Search stations"
                  onSelect={() => setIsSearchOpen(true)}>
                  <MagnifyingGlassIcon className="size-5" />
                </SpeedDialAction>
                <SpeedDialLabel>Search</SpeedDialLabel>
              </SpeedDialItem>
              <SpeedDialItem>
                <SpeedDialAction
                  aria-expanded={isSummaryOpen}
                  aria-label={
                    isSummaryOpen ? "Hide map summary" : "Show map summary"
                  }
                  onSelect={() => setIsSummaryOpen((open) => !open)}>
                  <BicycleIcon className="size-5" />
                </SpeedDialAction>
                <SpeedDialLabel>
                  {isSummaryOpen ? "Hide summary" : "Map summary"}
                </SpeedDialLabel>
              </SpeedDialItem>
              <SpeedDialItem>
                <SpeedDialAction
                  className={cn(
                    locationToastVariant === "error" &&
                      "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20",
                    locationToastVariant === "warning" &&
                      "border-warning/30 bg-warning/10 text-warning hover:bg-warning/20",
                    hasActiveLocation && "bg-secondary ring-1",
                  )}
                  aria-label={nearbyLabel}
                  onSelect={handleNearbyAction}>
                  <CrosshairSimpleIcon className="size-5" />
                </SpeedDialAction>
                <SpeedDialLabel>Nearby</SpeedDialLabel>
              </SpeedDialItem>
              <SpeedDialItem>
                <SpeedDialAction
                  aria-label="Open stations page"
                  onSelect={() => navigate({ to: "/stations" })}>
                  <ChargingStationIcon className="size-5" />
                </SpeedDialAction>
                <SpeedDialLabel>Stations</SpeedDialLabel>
              </SpeedDialItem>
              <SpeedDialItem>
                <SpeedDialAction
                  aria-label="Open about page"
                  onSelect={() => navigate({ to: "/about" })}>
                  <InfoIcon className="size-5" />
                </SpeedDialAction>
                <SpeedDialLabel>About</SpeedDialLabel>
              </SpeedDialItem>
            </SpeedDialContent>
            <SpeedDialTrigger
              aria-label="Open map controls"
              className="shadow-lg [&_svg]:transition-transform [&_svg]:duration-200 [&_svg]:ease-out data-[state=open]:[&_svg]:rotate-45">
              <PlusIcon className="size-5" weight="bold" />
            </SpeedDialTrigger>
          </SpeedDial>
        </div>
        <div className="hidden w-fit grid-cols-1 gap-1.5 md:grid">
          <Button
            aria-label="Search stations"
            variant="outline"
            onClick={() => setIsSearchOpen(true)}
            className="size-10 md:h-9 md:w-auto">
            <MagnifyingGlassIcon className="size-5 md:size-4" />
            <span className="hidden md:block">Search</span>
            <KbdGroup>
              <Kbd>⌘ K</Kbd>
            </KbdGroup>
          </Button>
          <NearbyButton
            userLocation={userLocation}
            onClearUserLocation={onClearUserLocation}
            onRequestUserLocation={onRequestUserLocation}
          />
          <Link
            to="/stations"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "size-10 md:h-9 md:w-auto md:justify-start",
            )}
            aria-label="Open stations page">
            <ChargingStationIcon className="size-5 md:size-4" />
            <span className="hidden md:inline">Stations</span>
          </Link>
          <Link
            to="/about"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "size-10 md:h-9 md:w-auto md:justify-start",
            )}
            aria-label="Open about page">
            <InfoIcon className="size-5 md:size-4" />
            <span className="hidden md:inline">About</span>
          </Link>
        </div>
        {stations.length > 0 ? (
          <MapSummary
            stations={stations}
            lastUpdated={lastUpdated}
            ariaHidden={!isSummaryOpen}
            className="fixed top-3 right-3 left-3 md:hidden"
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

      <StationSearch
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        stations={stations}
        onSelectStation={onSelectStation}
        userLocation={userLocation}
      />
    </>
  );
}
