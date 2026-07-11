import { ConvexProvider, ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";
import { api } from "./api";

export const convex = new ConvexReactClient(
  import.meta.env.VITE_CONVEX_URL as string,
);

export const STATION_AVAILABILITY_PROFILE_DAYS = 28;

export function prewarmStationAvailabilityProfile(
  stationId: string,
  days = STATION_AVAILABILITY_PROFILE_DAYS,
) {
  if (typeof window === "undefined") {
    return;
  }

  convex.prewarmQuery({
    query: api.pedalMap.getStationAvailabilityProfile,
    args: {
      days,
      stationId,
    },
    extendSubscriptionFor: 30_000,
  });
}

export default function ConvexRootProvider({
  children,
}: {
  children: ReactNode;
}) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
