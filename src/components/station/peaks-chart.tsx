import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import type {
  ProfileSlot,
  StationRow,
} from "#/components/station/profile.types";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "#/components/ui/chart";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "#/components/ui/empty";

interface PeaksPoint {
  label: string;
  slotIndex: number;
  value: number | null;
}

interface PeakValleyMarker {
  label: string;
  slotIndex: number;
  value: number;
}

export type PeakMetricKey = "bikes" | "electric" | "occupancy";

interface PeakMetric {
  key: PeakMetricKey;
  label: string;
  color: string;
  showCapacityReference: boolean;
  getValue: (slot: ProfileSlot) => number | null;
  formatValue: (value: number) => string;
}

export const peakMetrics: PeakMetric[] = [
  {
    key: "bikes",
    label: "Bikes",
    color: "var(--primary)",
    showCapacityReference: true,
    getValue: (slot) => slot.avgBikesAvailable,
    formatValue: (value) => value.toFixed(1),
  },
  {
    key: "electric",
    label: "Electric",
    color: "var(--primary)",
    showCapacityReference: true,
    getValue: (slot) => slot.avgEbikesAvailable,
    formatValue: (value) => value.toFixed(1),
  },
  {
    key: "occupancy",
    label: "Open Dock %",
    color: "var(--primary)",
    showCapacityReference: false,
    getValue: (slot) => slot.avgDockAvailabilityPct,
    formatValue: (value) =>
      value.toLocaleString(undefined, {
        maximumFractionDigits: 1,
        minimumFractionDigits: 1,
        style: "percent",
      }),
  },
];

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

  return value;
}

function combineSlotValue(
  slots: ProfileSlot[],
  getValue: PeakMetric["getValue"],
) {
  const weightedValues = slots
    .filter(
      (slot) => getValue(slot) !== null && Number.isFinite(getValue(slot)),
    )
    .map((slot) => ({
      sampleCount: slot.sampleCount,
      value: getValue(slot) ?? 0,
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
  metric: PeakMetric,
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
    value: toChartValue(
      combineSlotValue(
        [
          ...weekdayProfile.filter(
            (profileSlot) => profileSlot.slotIndex === slot.slotIndex,
          ),
          ...weekendProfile.filter(
            (profileSlot) => profileSlot.slotIndex === slot.slotIndex,
          ),
        ],
        metric.getValue,
      ),
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
  if (!slot || slot.value === null) {
    return null;
  }

  return {
    label: slot.label,
    slotIndex: slot.slotIndex,
    value: slot.value,
  };
}

function getPeakPoint(chartData: PeaksPoint[]) {
  return chartData.reduce<PeaksPoint | null>((peak, slot) => {
    if (slot.value === null) {
      return peak;
    }

    if (peak === null || peak.value === null) {
      return slot;
    }

    return slot.value > peak.value ? slot : peak;
  }, null);
}

function getValleyPoint(chartData: PeaksPoint[]) {
  return chartData.reduce<PeaksPoint | null>((valley, slot) => {
    if (slot.value === null) {
      return valley;
    }

    if (valley === null || valley.value === null) {
      return slot;
    }

    return slot.value < valley.value ? slot : valley;
  }, null);
}

function formatMarker(
  marker: PeakValleyMarker | null,
  formatValue: PeakMetric["formatValue"],
) {
  if (!marker) {
    return "--";
  }

  return `${marker.label} / ${formatValue(marker.value)}`;
}

function TimeTick({
  x,
  y,
  payload,
  slotsPerHour,
}: {
  x?: number;
  y?: number;
  payload?: { value: number };
  slotsPerHour: number;
}) {
  const value = payload?.value ?? 0;
  const hour = value / slotsPerHour;
  const labelByTick = new Map([
    [0, "12am"],
    [6, "6am"],
    [12, "12pm"],
    [18, "6pm"],
    [24, "12am"],
  ]);
  const label = labelByTick.get(hour) ?? "";

  return (
    <text
      x={x}
      y={y}
      dy={14}
      fill="var(--foreground)"
      fontSize={12}
      textAnchor={hour === 24 ? "end" : hour === 0 ? "start" : "middle"}
    >
      {label}
    </text>
  );
}

function MarkerDots({
  marker,
  variant,
}: {
  marker: PeakValleyMarker | null;
  variant: "peak" | "valley";
}) {
  if (!marker) {
    return null;
  }

  return (
    <ReferenceDot
      x={marker.slotIndex}
      y={marker.value}
      fill={
        variant === "peak" ? "var(--color-chart-5)" : "var(--color-destructive)"
      }
      ifOverflow="extendDomain"
      stroke="black"
      r={8}
    />
  );
}

export function PeaksChart({
  stationCapacity,
  metricKey,
  stationStatus: _stationStatus,
  weekdayProfile,
  weekendProfile,
}: {
  metricKey: PeakMetricKey;
  stationCapacity: number | null;
  stationStatus: StationRow | null;
  weekdayProfile: ProfileSlot[];
  weekendProfile: ProfileSlot[];
}) {
  const selectedMetric =
    peakMetrics.find((metric) => metric.key === metricKey) ?? peakMetrics[0];
  const chartConfig = {
    value: {
      label: selectedMetric.label,
      color: selectedMetric.color,
    },
  } satisfies ChartConfig;

  const chartData = buildChartData(
    weekdayProfile,
    weekendProfile,
    selectedMetric,
  );
  const hasData = chartData.some((point) => point.value !== null);
  const peak = getPeakValleyMarker(getPeakPoint(chartData));
  const valley = getPeakValleyMarker(getValleyPoint(chartData));
  const capacityReference =
    selectedMetric.showCapacityReference &&
    stationCapacity !== null &&
    Number.isFinite(stationCapacity) &&
    stationCapacity > 0
      ? stationCapacity
      : null;
  const maxSlotIndex = hasData
    ? Math.max(...chartData.map((point) => point.slotIndex))
    : 24;
  const slotsPerHour = maxSlotIndex > 24 ? maxSlotIndex / 24 : 1;
  const xTicks = [0, 6, 12, 18, 24].map((hour) => hour * slotsPerHour);
  const fillId = `peakAvailabilityFill-${selectedMetric.key}`;

  return (
    <Card className="flex h-full md:h-98">
      <CardHeader className="gap-3 px-4.5!">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-3">
          <div className="min-w-0">
            <CardTitle>Average {selectedMetric.label}</CardTitle>
            <div className="text-muted-foreground mt-1 flex items-center gap-3 text-xs font-medium">
              <p>
                <span className="text-chart-5">H:</span>{" "}
                {formatMarker(peak, selectedMetric.formatValue)}
              </p>
              <p>
                <span className="text-destructive">L:</span>{" "}
                {formatMarker(valley, selectedMetric.formatValue)}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col px-2 pt-0 pb-3 sm:px-4">
        {hasData ? (
          <ChartContainer
            config={chartConfig}
            className="[&_.recharts-cartesian-grid_line]:stroke-border/40 flex h-full min-h-0 w-full flex-1 [&_.recharts-legend-wrapper]:pt-2"
            initialDimension={{ width: 720, height: 320 }}
          >
            <AreaChart
              accessibilityLayer
              data={chartData}
              margin={{ top: 12, right: 12, bottom: 4, left: 0 }}
            >
              <MarkerDots marker={peak} variant="peak" />
              <MarkerDots marker={valley} variant="valley" />
              <defs>
                <linearGradient id={fillId} x1="0" x2="0" y1="0" y2="1">
                  <stop
                    offset="4%"
                    stopColor="var(--color-value)"
                    stopOpacity={0.46}
                  />
                  <stop
                    offset="92%"
                    stopColor="var(--color-value)"
                    stopOpacity={0.04}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="slotIndex"
                type="number"
                domain={[0, 24 * slotsPerHour]}
                axisLine={false}
                tickLine={false}
                tickMargin={12}
                ticks={xTicks}
                tick={<TimeTick slotsPerHour={slotsPerHour} />}
              />
              <YAxis
                hide
                domain={[
                  (dataMin) => Math.max(0, dataMin - 10),
                  (dataMax) =>
                    capacityReference === null
                      ? dataMax
                      : Math.max(dataMax, capacityReference),
                ]}
              />
              {capacityReference !== null ? (
                <ReferenceLine
                  y={capacityReference}
                  ifOverflow="extendDomain"
                  stroke="var(--muted-foreground)"
                  strokeDasharray="5 5"
                  strokeOpacity={0.72}
                  label={{
                    value: `Capacity ${capacityReference.toLocaleString()}`,
                    fill: "var(--muted-foreground)",
                    fontSize: 12,
                    position: "insideTopRight",
                  }}
                />
              ) : null}
              <ChartTooltip
                cursor={{
                  stroke: "var(--border)",
                  strokeDasharray: "4 4",
                }}
                content={
                  <ChartTooltipContent
                    className="min-w-44 px-3 py-2"
                    indicator="dot"
                    labelFormatter={(_, payload) => {
                      const point = payload[0]?.payload as
                        | PeaksPoint
                        | undefined;

                      return point?.label ?? "";
                    }}
                    labelClassName="text-foreground"
                    formatter={(value, _name, item) => (
                      <>
                        <div
                          className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                          style={{
                            backgroundColor: item.color,
                          }}
                        />
                        <div className="flex flex-1 justify-between leading-none">
                          <span className="text-muted-foreground">
                            {chartConfig.value.label}
                          </span>
                          <span className="text-foreground font-mono font-medium tabular-nums">
                            {typeof value === "number"
                              ? selectedMetric.formatValue(value)
                              : String(value)}
                          </span>
                        </div>
                      </>
                    )}
                  />
                }
              />
              <Area
                dataKey="value"
                type="natural"
                fill={`url(#${fillId})`}
                stroke="var(--color-value)"
                strokeWidth={3.25}
                dot={false}
                animationDuration={475}
                activeDot={{
                  r: 6,
                  fill: "var(--background)",
                  stroke: "var(--color-value)",
                  strokeWidth: 2.5,
                }}
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <Empty className="min-h-74 flex-1 border-0 p-6">
            <EmptyHeader>
              <EmptyTitle>No availability data</EmptyTitle>
              <EmptyDescription>
                Average bike availability will appear here once this station has
                enough samples.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}
