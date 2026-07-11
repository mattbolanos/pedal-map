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
