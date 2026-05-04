import {
  AvailabilityChart,
  type AvailabilityPoint,
  type PeakMarker,
} from "#/components/station/availability-chart";
import {
  ComparisonChart,
  type ComparisonDatum,
} from "#/components/station/comparison-chart";
import type {
  DaySummary,
  ProfileSlot,
  StationRow,
} from "#/components/station/profile.types";

function getAverage(
  slots: ProfileSlot[],
  key: keyof Pick<
    ProfileSlot,
    | "avgBikesAvailable"
    | "avgClassicBikesAvailable"
    | "avgDocksAvailable"
    | "avgEbikesAvailable"
    | "avgOccupancyPct"
  >,
) {
  const values = slots
    .map((slot) => slot[key])
    .filter(
      (value): value is number => value !== null && Number.isFinite(value),
    );

  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function summarizeDayProfile(slots: ProfileSlot[]): DaySummary {
  const peakBikeSlot = slots.reduce<ProfileSlot | null>((peak, slot) => {
    if (slot.avgBikesAvailable === null) {
      return peak;
    }

    if (peak === null || peak.avgBikesAvailable === null) {
      return slot;
    }

    return slot.avgBikesAvailable > peak.avgBikesAvailable ? slot : peak;
  }, null);

  return {
    averageBikes: getAverage(slots, "avgBikesAvailable"),
    averageClassicBikes: getAverage(slots, "avgClassicBikesAvailable"),
    averageDocks: getAverage(slots, "avgDocksAvailable"),
    averageEbikes: getAverage(slots, "avgEbikesAvailable"),
    averageOccupancyPct: getAverage(slots, "avgOccupancyPct"),
    emptyRate: null,
    fullRate: null,
    peakBikeSlot,
    sampleCount: slots.reduce((sum, slot) => sum + slot.sampleCount, 0),
  };
}

function formatSlotTime(label: string, slotIndex: number) {
  const trimmedLabel = label.trim();
  const timeMatch = trimmedLabel.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  const rawHour = timeMatch ? Number(timeMatch[1]) : slotIndex;
  const minutes = timeMatch?.[2] ?? "00";
  const meridiem = timeMatch?.[3]?.toLowerCase();
  const hour24 =
    meridiem === "pm" && rawHour < 12
      ? rawHour + 12
      : meridiem === "am" && rawHour === 12
        ? 0
        : rawHour;

  if (!Number.isFinite(hour24)) {
    return trimmedLabel;
  }

  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const period = hour24 % 24 < 12 ? "am" : "pm";

  return minutes === "00"
    ? `${hour12}${period}`
    : `${hour12}:${minutes}${period}`;
}

function toChartValue(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return null;
  }

  return Number(value.toFixed(1));
}

function getSlotValue(slots: ProfileSlot[], slotIndex: number) {
  return (
    slots.find((slot) => slot.slotIndex === slotIndex)?.avgBikesAvailable ??
    null
  );
}

function buildChartData(
  weekdayProfile: ProfileSlot[],
  weekendProfile: ProfileSlot[],
): AvailabilityPoint[] {
  const slots = [...weekdayProfile, ...weekendProfile]
    .map((slot) => ({
      label: slot.slotLabel,
      slotIndex: slot.slotIndex,
    }))
    .filter(
      (slot, index, allSlots) =>
        allSlots.findIndex(
          (candidate) => candidate.slotIndex === slot.slotIndex,
        ) === index,
    )
    .sort((slotA, slotB) => slotA.slotIndex - slotB.slotIndex);

  return slots.map((slot) => ({
    label: formatSlotTime(slot.label, slot.slotIndex),
    slotIndex: slot.slotIndex,
    weekday: toChartValue(getSlotValue(weekdayProfile, slot.slotIndex)),
    weekend: toChartValue(getSlotValue(weekendProfile, slot.slotIndex)),
  }));
}

function getTickLabels(chartData: AvailabilityPoint[]) {
  if (chartData.length <= 5) {
    return chartData.map((slot) => slot.label);
  }

  const indexes = [
    0,
    Math.floor((chartData.length - 1) * 0.25),
    Math.floor((chartData.length - 1) * 0.5),
    Math.floor((chartData.length - 1) * 0.75),
    chartData.length - 1,
  ];

  return [
    ...new Set(
      indexes
        .map((index) => chartData[index]?.label)
        .filter((label): label is string => typeof label === "string"),
    ),
  ];
}

function getPeakLabel(slot: ProfileSlot | null) {
  if (!slot) {
    return "--";
  }

  return formatSlotTime(slot.slotLabel, slot.slotIndex);
}

function getPeakMarker(slot: ProfileSlot | null): PeakMarker | null {
  if (!slot || slot.avgBikesAvailable === null) {
    return null;
  }

  return {
    label: getPeakLabel(slot),
    value: toChartValue(slot.avgBikesAvailable) ?? slot.avgBikesAvailable,
  };
}

function toMetricValue(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return 0;
  }

  return Number(value.toFixed(1));
}

function buildMetricComparisonData(
  weekdaySummary: DaySummary,
  weekendSummary: DaySummary,
): ComparisonDatum[] {
  return [
    {
      metric: "Avg bikes",
      weekday: toMetricValue(weekdaySummary.averageBikes),
      weekend: toMetricValue(weekendSummary.averageBikes),
    },
    {
      metric: "Peak bikes",
      weekday: toMetricValue(
        weekdaySummary.peakBikeSlot?.avgBikesAvailable ?? null,
      ),
      weekend: toMetricValue(
        weekendSummary.peakBikeSlot?.avgBikesAvailable ?? null,
      ),
    },
    {
      metric: "Avg e-bikes",
      weekday: toMetricValue(weekdaySummary.averageEbikes),
      weekend: toMetricValue(weekendSummary.averageEbikes),
    },
    {
      metric: "Avg docks",
      weekday: toMetricValue(weekdaySummary.averageDocks),
      weekend: toMetricValue(weekendSummary.averageDocks),
    },
  ];
}

export function StationProfile({
  stationStatus,
  weekdayProfile,
  weekendProfile,
}: {
  stationStatus: StationRow | null;
  weekdayProfile: ProfileSlot[];
  weekendProfile: ProfileSlot[];
}) {
  if (weekdayProfile.length === 0 && weekendProfile.length === 0) {
    return null;
  }

  const weekdaySummary = summarizeDayProfile(weekdayProfile);
  const weekendSummary = summarizeDayProfile(weekendProfile);
  const chartData = buildChartData(weekdayProfile, weekendProfile);
  const tickLabels = getTickLabels(chartData);
  const chartValues = chartData.flatMap((slot) => [slot.weekday, slot.weekend]);
  const chartMaxValue = Math.max(
    4,
    ...chartValues.filter(
      (value): value is number => value !== null && Number.isFinite(value),
    ),
  );
  const chartMax = Math.ceil(chartMaxValue + 1);
  const metricComparisonData = buildMetricComparisonData(
    weekdaySummary,
    weekendSummary,
  );

  return (
    <>
      <AvailabilityChart
        chartData={chartData}
        chartMax={chartMax}
        isOffline={stationStatus?.isActive === false}
        tickLabels={tickLabels}
        weekdayPeak={getPeakMarker(weekdaySummary.peakBikeSlot)}
        weekendPeak={getPeakMarker(weekendSummary.peakBikeSlot)}
      />
      <ComparisonChart data={metricComparisonData} />
    </>
  );
}
