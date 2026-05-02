import { CrosshairSimpleIcon } from "@phosphor-icons/react/dist/csr/CrosshairSimple";
import {
  getUserLocationToast,
  hasActiveUserLocation,
  type UserLocationState,
} from "#/lib/user-location";
import { cn } from "#/lib/utils";
import { Button } from "./ui/button";

interface NearbyButtonProps {
  userLocation: UserLocationState;
  onClearUserLocation: () => void;
  onRequestUserLocation: () => void;
}

export function NearbyButton({
  userLocation,
  onClearUserLocation,
  onRequestUserLocation,
}: NearbyButtonProps) {
  const hasActiveLocation = hasActiveUserLocation(userLocation);
  const locationToastVariant = getUserLocationToast(userLocation)?.variant;

  const locationAriaLabel = hasActiveLocation
    ? "Turn off current location"
    : userLocation.status === "granted" && !userLocation.isInServiceArea
      ? "Clear your current location outside the Citi Bike service area"
      : "Use your current location";

  return (
    <Button
      variant={
        locationToastVariant === "warning"
          ? "warning"
          : locationToastVariant === "error"
            ? "destructive"
            : "outline"
      }
      className={cn(
        "size-10 md:h-9 md:w-auto md:justify-start",
        hasActiveLocation && "bg-secondary! ring-1",
      )}
      aria-label={locationAriaLabel}
      onClick={
        userLocation.status === "granted"
          ? onClearUserLocation
          : onRequestUserLocation
      }>
      <CrosshairSimpleIcon className="size-5 md:size-4" />
      <span className="hidden md:block">Nearby</span>
    </Button>
  );
}
