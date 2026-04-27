import { anyApi, type FunctionReference } from "convex/server";
import type { GenericId as Id } from "convex/values";

export const api: PublicApiType = anyApi as unknown as PublicApiType;
export const internal: InternalApiType = anyApi as unknown as InternalApiType;

export type PublicApiType = {
  ingestion: {
    getSamplingBootstrap: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      any
    >;
    getExistingAvailabilitySampleDocIds: FunctionReference<
      "query",
      "public",
      { sampledAt: number },
      any
    >;
    upsertStationCatalogBatch: FunctionReference<
      "mutation",
      "public",
      {
        metadataLastSeenAt: number;
        stations: Array<{
          capacity: number | null;
          eightdHasKeyDispenser: boolean | null;
          electricBikeSurchargeWaiver: boolean | null;
          existingStationId: Id<"stationCatalog"> | null;
          externalId: string | null;
          hasKiosk: boolean | null;
          isActive: boolean;
          lat: number;
          lon: number;
          name: string;
          regionId: string | null;
          rentalMethods: Array<string>;
          shortName: string | null;
          stationId: string;
        }>;
      },
      any
    >;
    markStationCatalogSync: FunctionReference<
      "mutation",
      "public",
      { feedLastUpdated: number; syncedAt: number },
      any
    >;
    upsertAvailabilitySampleBatch: FunctionReference<
      "mutation",
      "public",
      {
        feedLastUpdated: number;
        rows: Array<{
          bikesAvailable: number;
          bikesChange: number;
          capacity: number | null;
          dockAvailabilityPct: number | null;
          docksAvailable: number;
          docksChange: number;
          ebikesAvailable: number | null;
          existingLatestAvailabilityId: Id<"stationLatestAvailability"> | null;
          existingSampleId: Id<"stationAvailabilitySamples"> | null;
          inferredArrivals: number;
          inferredDepartures: number;
          isEmpty: boolean;
          isFull: boolean;
          isInstalled: boolean;
          isNearEmpty: boolean;
          isNearFull: boolean;
          isRenting: boolean;
          isReturning: boolean;
          isWeekend: boolean;
          lastReported: number;
          localDate: string;
          localHour: number;
          numBikesDisabled: number | null;
          numDocksDisabled: number | null;
          occupancyPct: number | null;
          sampleIntervalMinutes: number;
          slotIndex: number;
          slotLabel: string;
          stationId: string;
          turnover: number;
        }>;
        sampleRetentionDays: number;
        sampledAt: number;
      },
      any
    >;
    markAvailabilityIngestComplete: FunctionReference<
      "mutation",
      "public",
      { completedAt: number; feedLastUpdated: number },
      any
    >;
  };
  pedalMap: {
    getStationsTableData: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      {
        activeStationCount: number;
        currentSummary: {
          activeStationCount: number;
          avgBikesAvailable: number | null;
          avgDockAvailabilityPct: number | null;
          avgDocksAvailable: number | null;
          avgEbikesAvailable: number | null;
          avgOccupancyPct: number | null;
          emptyStationCount: number;
          fullStationCount: number;
          sampledAt: number | null;
          sumInferredArrivals: number;
          sumInferredDepartures: number;
          sumTurnover: number;
        };
        generatedAt: number;
        latestDate: string | null;
        pipeline: {
          availabilityFeedLastUpdated: number | null;
          stationCatalogFeedLastUpdated: number | null;
          stationCatalogSyncAt: number | null;
        };
        pressureStations: Array<{
          avgOccupancyPct: number | null;
          capacity: number | null;
          dropoffReliabilityPct: number | null;
          emptySampleCount: number;
          fullSampleCount: number;
          lat: number;
          lon: number;
          name: string;
          pickupReliabilityPct: number | null;
          pressureScore: number | null;
          regionId: string | null;
          stationId: string;
          sumInferredArrivals: number;
          sumInferredDepartures: number;
          sumTurnover: number;
        }>;
        reliabilityLeaders: Array<{
          avgOccupancyPct: number | null;
          capacity: number | null;
          dropoffReliabilityPct: number | null;
          emptySampleCount: number;
          fullSampleCount: number;
          lat: number;
          lon: number;
          name: string;
          pickupReliabilityPct: number | null;
          regionId: string | null;
          reliabilityScore: number | null;
          stationId: string;
          sumInferredArrivals: number;
          sumInferredDepartures: number;
          sumTurnover: number;
        }>;
        rows: Array<{
          avgBikesAvailable: number | null;
          avgDockAvailabilityPct: number | null;
          avgDocksAvailable: number | null;
          avgEbikesAvailable: number | null;
          avgOccupancyPct: number | null;
          bikesAvailable: number | null;
          capacity: number | null;
          currentDockAvailabilityPct: number | null;
          currentInferredArrivals: number | null;
          currentInferredDepartures: number | null;
          currentOccupancyPct: number | null;
          currentTurnover: number | null;
          docksAvailable: number | null;
          dropoffReliabilityPct: number | null;
          ebikesAvailable: number | null;
          emptySampleCount: number | null;
          externalId: string | null;
          fullSampleCount: number | null;
          hasKiosk: boolean | null;
          isActive: boolean;
          isEmpty: boolean | null;
          isFull: boolean | null;
          isInstalled: boolean | null;
          isRenting: boolean | null;
          isReturning: boolean | null;
          lastReported: number | null;
          lat: number;
          lon: number;
          name: string;
          nearEmptySampleCount: number | null;
          nearFullSampleCount: number | null;
          observedMinutes: number | null;
          pickupReliabilityPct: number | null;
          pressureScore: number | null;
          regionId: string | null;
          reliabilityScore: number | null;
          sampleCount: number | null;
          sampledAt: number | null;
          shortName: string | null;
          stationId: string;
          sumInferredArrivals: number | null;
          sumInferredDepartures: number | null;
          sumTurnover: number | null;
          summaryDate: string | null;
        }>;
        stationCount: number;
        topTurnoverStations: Array<{
          avgOccupancyPct: number | null;
          capacity: number | null;
          dropoffReliabilityPct: number | null;
          emptySampleCount: number;
          fullSampleCount: number;
          lat: number;
          lon: number;
          name: string;
          pickupReliabilityPct: number | null;
          regionId: string | null;
          stationId: string;
          sumInferredArrivals: number;
          sumInferredDepartures: number;
          sumTurnover: number;
        }>;
      }
    >;
    getStationAvailabilityProfile: FunctionReference<
      "query",
      "public",
      { days: number; stationId: string },
      {
        daysRequested: number;
        sampledDayCount: number;
        station: {
          capacity: number | null;
          lat: number;
          lon: number;
          name: string;
          regionId: string | null;
          stationId: string;
        } | null;
        summary: {
          activeSampleCount: number;
          avgBikesAvailable: number | null;
          avgClassicBikesAvailable: number | null;
          avgDisabledBikes: number | null;
          avgDisabledDocks: number | null;
          avgDockAvailabilityPct: number | null;
          avgDocksAvailable: number | null;
          avgEbikesAvailable: number | null;
          avgOccupancyPct: number | null;
          avgTurnover: number | null;
          ebikeKnownSampleCount: number;
          ebikeUnavailableRate: number | null;
          emptyRate: number | null;
          fullRate: number | null;
          inactiveSampleCount: number;
          sampleCount: number;
        };
        weekdayProfile: Array<{
          activeSampleCount: number;
          avgBikesAvailable: number | null;
          avgClassicBikesAvailable: number | null;
          avgDisabledBikes: number | null;
          avgDisabledDocks: number | null;
          avgDockAvailabilityPct: number | null;
          avgDocksAvailable: number | null;
          avgEbikesAvailable: number | null;
          avgOccupancyPct: number | null;
          avgTurnover: number | null;
          ebikeKnownSampleCount: number;
          ebikeUnavailableRate: number | null;
          emptyRate: number | null;
          fullRate: number | null;
          inactiveSampleCount: number;
          profileType: "weekday" | "weekend";
          sampleCount: number;
          slotIndex: number;
          slotLabel: string;
        }>;
        weekendProfile: Array<{
          activeSampleCount: number;
          avgBikesAvailable: number | null;
          avgClassicBikesAvailable: number | null;
          avgDisabledBikes: number | null;
          avgDisabledDocks: number | null;
          avgDockAvailabilityPct: number | null;
          avgDocksAvailable: number | null;
          avgEbikesAvailable: number | null;
          avgOccupancyPct: number | null;
          avgTurnover: number | null;
          ebikeKnownSampleCount: number;
          ebikeUnavailableRate: number | null;
          emptyRate: number | null;
          fullRate: number | null;
          inactiveSampleCount: number;
          profileType: "weekday" | "weekend";
          sampleCount: number;
          slotIndex: number;
          slotLabel: string;
        }>;
      }
    >;
    getAvailabilityMapProfile: FunctionReference<
      "query",
      "public",
      {
        days: number;
        profileType: "all" | "weekday" | "weekend";
        resolution: "hour" | "slot";
      },
      {
        daysRequested: number;
        generatedAt: number;
        profileType: "all" | "weekday" | "weekend";
        resolution: "hour" | "slot";
        sampledDayCount: number;
        slots: Array<{
          profileType: "all" | "weekday" | "weekend";
          slotIndex: number;
          slotLabel: string;
          stationMetrics: Array<{
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
            sampleCount: number;
            stationId: string;
          }>;
        }>;
        stations: Array<{
          capacity: number | null;
          isActive: boolean;
          lat: number;
          lon: number;
          name: string;
          regionId: string | null;
          shortName: string | null;
          stationId: string;
        }>;
      }
    >;
    getSystemAvailabilityProfile: FunctionReference<
      "query",
      "public",
      { days: number },
      {
        daysRequested: number;
        sampledDayCount: number;
        summary: {
          avgActiveStationCount: number;
          avgEbikeKnownStationCount: number;
          avgEbikeUnavailableStationRate: number | null;
          avgInactiveStationCount: number;
          avgOpenDockPct: number | null;
          avgTotalBikesAvailable: number;
          avgTotalClassicBikesAvailable: number | null;
          avgTotalDisabledBikes: number | null;
          avgTotalDisabledDocks: number | null;
          avgTotalDocksAvailable: number;
          avgTotalEbikesAvailable: number | null;
          avgTotalTurnover: number;
          snapshotCount: number;
        };
        weekdayProfile: Array<{
          avgActiveStationCount: number;
          avgEbikeKnownStationCount: number;
          avgEbikeUnavailableStationRate: number | null;
          avgInactiveStationCount: number;
          avgOpenDockPct: number | null;
          avgTotalBikesAvailable: number;
          avgTotalClassicBikesAvailable: number | null;
          avgTotalDisabledBikes: number | null;
          avgTotalDisabledDocks: number | null;
          avgTotalDocksAvailable: number;
          avgTotalEbikesAvailable: number | null;
          avgTotalTurnover: number;
          profileType: "weekday" | "weekend";
          slotIndex: number;
          slotLabel: string;
          snapshotCount: number;
        }>;
        weekendProfile: Array<{
          avgActiveStationCount: number;
          avgEbikeKnownStationCount: number;
          avgEbikeUnavailableStationRate: number | null;
          avgInactiveStationCount: number;
          avgOpenDockPct: number | null;
          avgTotalBikesAvailable: number;
          avgTotalClassicBikesAvailable: number | null;
          avgTotalDisabledBikes: number | null;
          avgTotalDisabledDocks: number | null;
          avgTotalDocksAvailable: number;
          avgTotalEbikesAvailable: number | null;
          avgTotalTurnover: number;
          profileType: "weekday" | "weekend";
          slotIndex: number;
          slotLabel: string;
          snapshotCount: number;
        }>;
      }
    >;
  };
  rollups: {
    runScheduledRollup: FunctionReference<
      "action",
      "public",
      {
        ingestIntervalMinutes: number;
        lookbackHours: number;
        nowMs: number;
        pageSize: number;
        pruneBatchSize: number;
        reportingTimezone: string;
      },
      any
    >;
  };
};
export type InternalApiType = {};
