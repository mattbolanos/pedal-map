import { anyApi, type FunctionReference } from "convex/server";

interface AvailabilityMetrics {
  sampleCount: number;
  activeSampleCount: number;
  inactiveSampleCount: number;
  ebikeKnownSampleCount: number;
  avgBikesAvailable: number | null;
  avgClassicBikesAvailable: number | null;
  avgEbikesAvailable: number | null;
  ebikeUnavailableRate: number | null;
  avgDocksAvailable: number | null;
  avgOccupancyPct: number | null;
  avgDockAvailabilityPct: number | null;
  avgDisabledBikes: number | null;
  avgDisabledDocks: number | null;
  avgTurnover: number | null;
  emptyRate: number | null;
  fullRate: number | null;
}

interface AvailabilityProfileSlot extends AvailabilityMetrics {
  profileType: "weekday" | "weekend";
  slotIndex: number;
  slotLabel: string;
}

interface StationAvailabilityProfile {
  station: {
    stationId: string;
    name: string;
    lat: number;
    lon: number;
    capacity: number | null;
    regionId: string | null;
  } | null;
  daysRequested: number;
  sampledDayCount: number;
  averageRankDate: string | null;
  averageRankStationCount: number;
  averageRanks: {
    bikesAvailable: number | null;
    ebikesAvailable: number | null;
  };
  summary: AvailabilityMetrics;
  weekdayProfile: AvailabilityProfileSlot[];
  weekendProfile: AvailabilityProfileSlot[];
}

export type PublicApiType = {
  pedalMap: {
    getLatestStationAverageRanks: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      {
        date: string | null;
        stationCount: number;
        rows: Array<{
          stationId: string;
          avgBikesRank: number | null;
          avgEbikesRank: number | null;
        }>;
      }
    >;
    getStationAvailabilityProfile: FunctionReference<
      "query",
      "public",
      { days: number; stationId: string },
      StationAvailabilityProfile
    >;
  };
};

export const api: PublicApiType = anyApi as unknown as PublicApiType;
