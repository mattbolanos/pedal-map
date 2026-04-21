import { queryOptions } from "@tanstack/react-query";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import type { StationRegionId } from "./station-region";

export interface InsightsSummary {
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

export interface InsightsPipeline {
  availabilityFeedLastUpdated: number | null;
  stationCatalogFeedLastUpdated: number | null;
  stationCatalogSyncAt: number | null;
}

export interface InsightsLeaderboardStation {
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

export interface InsightsStationRow {
  stationId: string;
  name: string;
  lat: number;
  lon: number;
  capacity: number | null;
  regionId: StationRegionId;
  shortName: string | null;
  hasKiosk: boolean | null;
  externalId: string | null;
  isActive: boolean;
  sampledAt: number | null;
  lastReported: number | null;
  bikesAvailable: number | null;
  docksAvailable: number | null;
  ebikesAvailable: number | null;
  currentOccupancyPct: number | null;
  currentDockAvailabilityPct: number | null;
  isInstalled: boolean | null;
  isRenting: boolean | null;
  isReturning: boolean | null;
  isEmpty: boolean | null;
  isFull: boolean | null;
  currentInferredDepartures: number | null;
  currentInferredArrivals: number | null;
  currentTurnover: number | null;
  summaryDate: string | null;
  sampleCount: number | null;
  observedMinutes: number | null;
  avgBikesAvailable: number | null;
  avgDocksAvailable: number | null;
  avgEbikesAvailable: number | null;
  avgOccupancyPct: number | null;
  avgDockAvailabilityPct: number | null;
  sumInferredDepartures: number | null;
  sumInferredArrivals: number | null;
  sumTurnover: number | null;
  emptySampleCount: number | null;
  nearEmptySampleCount: number | null;
  fullSampleCount: number | null;
  nearFullSampleCount: number | null;
  pickupReliabilityPct: number | null;
  dropoffReliabilityPct: number | null;
  reliabilityScore: number | null;
  pressureScore: number | null;
}

export interface PedalMapInsightsData {
  generatedAt: number;
  stationCount: number;
  activeStationCount: number;
  latestDate: string | null;
  currentSummary: InsightsSummary;
  pipeline: InsightsPipeline;
  rows: InsightsStationRow[];
  topTurnoverStations: InsightsLeaderboardStation[];
  reliabilityLeaders: InsightsLeaderboardStation[];
  pressureStations: InsightsLeaderboardStation[];
}

const PEDAL_MAP_INSIGHTS_QUERY = makeFunctionReference<
  "query",
  Record<string, never>,
  PedalMapInsightsData
>("pedalMap:getInsightsTableData");

let client: ConvexHttpClient | null = null;

function getConvexClient() {
  const convexUrl = import.meta.env.VITE_CONVEX_URL;

  if (!convexUrl) {
    throw new Error("Missing VITE_CONVEX_URL");
  }

  if (client) {
    return client;
  }

  client = new ConvexHttpClient(convexUrl);
  return client;
}

async function fetchPedalMapInsights() {
  return getConvexClient().query(PEDAL_MAP_INSIGHTS_QUERY, {});
}

export const pedalMapInsightsQueryOptions = queryOptions({
  queryKey: ["convex", "pedalMap", "getInsightsTableData"] as const,
  queryFn: fetchPedalMapInsights,
  staleTime: 60 * 1000,
  gcTime: 10 * 60 * 1000,
  refetchOnWindowFocus: false,
});
