import { ConvexProvider, ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";
import { api } from "./api";

export const convex = new ConvexReactClient(
  import.meta.env.VITE_CONVEX_URL as string,
);

export function prewarmStationsTableData() {
  if (typeof window === "undefined") {
    return;
  }

  convex.prewarmQuery({
    query: api.pedalMap.getStationsTableData,
    args: {},
    extendSubscriptionFor: 30_000,
  });
}

export function prewarmStationAvailabilityProfile(
  stationId: string,
  days: number,
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
