import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";

export interface AnalyticsCurrentSummary {
  sampledAt: number | null;
  activeStationCount: number;
  avgBikesAvailable: number | null;
  avgDocksAvailable: number | null;
  avgEbikesAvailable: number | null;
  avgOccupancyPct: number | null;
  avgDockAvailabilityPct: number | null;
  emptyStationCount: number;
  fullStationCount: number;
  sumInferredDepartures: number;
  sumInferredArrivals: number;
  sumTurnover: number;
}

export interface AnalyticsStationLeaderboardEntry {
  stationId: string;
  name: string;
  lat: number | null;
  lon: number | null;
  capacity: number | null;
  regionId: string | null;
  avgOccupancyPct: number | null;
  sumTurnover: number;
  sumInferredDepartures: number;
  sumInferredArrivals: number;
  emptySampleCount: number;
  fullSampleCount: number;
  pickupReliabilityPct: number | null;
  dropoffReliabilityPct: number | null;
  reliabilityScore?: number | null;
  pressureScore?: number | null;
}

export interface AnalyticsDashboard {
  generatedAt: number;
  stationCount: number;
  activeStationCount: number;
  latestDate: string | null;
  currentSummary: AnalyticsCurrentSummary;
  pipeline: {
    availabilityFeedLastUpdated: number | null;
    stationCatalogFeedLastUpdated: number | null;
    stationCatalogSyncAt: number | null;
  };
  topTurnoverStations: AnalyticsStationLeaderboardEntry[];
  reliabilityLeaders: AnalyticsStationLeaderboardEntry[];
  pressureStations: AnalyticsStationLeaderboardEntry[];
}

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL?.trim() ?? "";

const convexClient = CONVEX_URL
  ? new ConvexHttpClient(CONVEX_URL, { logger: false })
  : null;

const analyticsDashboardQuery = makeFunctionReference<
  "query",
  Record<string, never>,
  AnalyticsDashboard
>("analytics:getDashboard");

export const isConvexConfigured = CONVEX_URL.length > 0;

export const analyticsDashboardQueryOptions = queryOptions({
  queryKey: ["convex", "analytics", "dashboard"],
  queryFn: async () => {
    if (!convexClient) {
      throw new Error("Missing VITE_CONVEX_URL");
    }

    return convexClient.query(analyticsDashboardQuery, {});
  },
  staleTime: 60_000,
  refetchInterval: 60_000,
  refetchOnWindowFocus: false,
  placeholderData: keepPreviousData,
});
