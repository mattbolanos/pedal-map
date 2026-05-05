import type { FunctionReturnType } from "convex/server";
import type { api } from "#/integrations/convex/api";

type StationsData = FunctionReturnType<
  typeof api.pedalMap.getStationsTableData
>;

export type StationRow = StationsData["rows"][number];

export interface ProfileSlot {
  activeSampleCount: number;
  avgBikesAvailable: number | null;
  avgClassicBikesAvailable: number | null;
  avgDockAvailabilityPct: number | null;
  avgDocksAvailable: number | null;
  avgEbikesAvailable: number | null;
  avgOccupancyPct: number | null;
  avgTurnover: number | null;
  emptyRate: number | null;
  fullRate: number | null;
  inactiveSampleCount: number;
  profileType: "weekday" | "weekend";
  sampleCount: number;
  slotIndex: number;
  slotLabel: string;
}

export interface DaySummary {
  averageBikes: number | null;
  averageClassicBikes: number | null;
  averageDocks: number | null;
  averageEbikes: number | null;
  averageOccupancyPct: number | null;
  emptyRate: number | null;
  fullRate: number | null;
  peakBikeSlot: ProfileSlot | null;
  sampleCount: number;
}
