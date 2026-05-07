import {
  ComparisonChart,
  type ComparisonDatum,
} from "#/components/station/comparison-chart";
import {
  PeaksChart,
  type PeaksPoint,
  type PeakValleyMarker,
} from "#/components/station/peaks-chart";
import type {
  ProfileSlot,
  StationRow,
} from "#/components/station/profile.types";

type ComparisonMetricKey = keyof Pick<
  ProfileSlot,
  "avgClassicBikesAvailable" | "avgDocksAvailable" | "avgEbikesAvailable"
>;

function getAverage(
  slots: ProfileSlot[],
  key: keyof Pick<ProfileSlot, "avgBikesAvailable" | ComparisonMetricKey>,
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

function combineSlotValue(slots: ProfileSlot[]) {
  const weightedValues = slots
    .filter(
      (slot) =>
        slot.avgBikesAvailable !== null &&
        Number.isFinite(slot.avgBikesAvailable),
    )
    .map((slot) => ({
      sampleCount: slot.sampleCount,
      value: slot.avgBikesAvailable ?? 0,
    }));

  if (weightedValues.length === 0) {
    return null;
  }

  const totalSamples = weightedValues.reduce(
    (sum, slot) => sum + slot.sampleCount,
    0,
  );

  if (totalSamples <= 0) {
    return (
      weightedValues.reduce((sum, slot) => sum + slot.value, 0) /
      weightedValues.length
    );
  }

  return (
    weightedValues.reduce(
      (sum, slot) => sum + slot.value * slot.sampleCount,
      0,
    ) / totalSamples
  );
}

function buildChartData(
  weekdayProfile: ProfileSlot[],
  weekendProfile: ProfileSlot[],
): PeaksPoint[] {
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

  const data = slots.map((slot) => ({
    label: formatSlotTime(slot.label, slot.slotIndex),
    slotIndex: slot.slotIndex,
    bikes: toChartValue(
      combineSlotValue([
        ...weekdayProfile.filter(
          (profileSlot) => profileSlot.slotIndex === slot.slotIndex,
        ),
        ...weekendProfile.filter(
          (profileSlot) => profileSlot.slotIndex === slot.slotIndex,
        ),
      ]),
    ),
  }));

  const firstSlot = data[0];
  if (!firstSlot) {
    return data;
  }

  const slotInterval =
    data.length > 1 ? data[1].slotIndex - data[0].slotIndex : 1;
  const lastSlot = data[data.length - 1];

  return [
    ...data,
    {
      ...firstSlot,
      label: "12am",
      slotIndex: lastSlot.slotIndex + slotInterval,
    },
  ];
}

function getPeakValleyMarker(slot: PeaksPoint | null): PeakValleyMarker | null {
  if (!slot || slot.bikes === null) {
    return null;
  }

  return {
    label: slot.label,
    slotIndex: slot.slotIndex,
    value: slot.bikes,
  };
}

function getPeakPoint(chartData: PeaksPoint[]) {
  return chartData.reduce<PeaksPoint | null>((peak, slot) => {
    if (slot.bikes === null) {
      return peak;
    }

    if (peak === null || peak.bikes === null) {
      return slot;
    }

    return slot.bikes > peak.bikes ? slot : peak;
  }, null);
}

function getValleyPoint(chartData: PeaksPoint[]) {
  return chartData.reduce<PeaksPoint | null>((valley, slot) => {
    if (slot.bikes === null) {
      return valley;
    }

    if (valley === null || valley.bikes === null) {
      return slot;
    }

    return slot.bikes < valley.bikes ? slot : valley;
  }, null);
}

function toMetricValue(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return 0;
  }

  return Number(value.toFixed(1));
}

const comparisonMetrics: Array<{
  key: ComparisonMetricKey;
  label: string;
}> = [
  { key: "avgEbikesAvailable", label: "Electrics" },
  { key: "avgClassicBikesAvailable", label: "Classics" },
  { key: "avgDocksAvailable", label: "Docks" },
];

function buildMetricComparisonData({
  weekdayProfile,
  weekendProfile,
}: {
  weekdayProfile: ProfileSlot[];
  weekendProfile: ProfileSlot[];
}): ComparisonDatum[] {
  return comparisonMetrics.map(({ key, label }) => ({
    metric: label,
    weekday: toMetricValue(getAverage(weekdayProfile, key)),
    weekend: toMetricValue(getAverage(weekendProfile, key)),
  }));
}

export function StationProfile({
  chart = "all",
  stationStatus,
  weekdayProfile,
  weekendProfile,
}: {
  chart?: "all" | "peaks" | "comparison";
  stationStatus: StationRow | null;
  weekdayProfile: ProfileSlot[];
  weekendProfile: ProfileSlot[];
}) {
  if (weekdayProfile.length === 0 && weekendProfile.length === 0) {
    return null;
  }

  const chartData = buildChartData(weekdayProfile, weekendProfile);
  const metricComparisonData = buildMetricComparisonData({
    weekdayProfile,
    weekendProfile,
  });

  return (
    <>
      {chart === "all" || chart === "peaks" ? (
        <PeaksChart
          chartData={chartData}
          currentBikes={stationStatus?.bikesAvailable ?? null}
          isOffline={stationStatus?.isActive === false}
          peak={getPeakValleyMarker(getPeakPoint(chartData))}
          valley={getPeakValleyMarker(getValleyPoint(chartData))}
        />
      ) : null}
      {chart === "all" || chart === "comparison" ? (
        <ComparisonChart data={metricComparisonData} />
      ) : null}
    </>
  );
}
