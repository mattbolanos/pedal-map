import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  XAxis,
  YAxis,
} from "recharts";
import type {
  ProfileSlot,
  StationRow,
} from "#/components/station/profile.types";
import { Badge } from "#/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "#/components/ui/chart";

interface PeaksPoint {
  label: string;
  slotIndex: number;
  bikes: number | null;
}

interface PeakValleyMarker {
  label: string;
  slotIndex: number;
  value: number;
}

const peaksChartConfig = {
  bikes: {
    label: "Bikes",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

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

function formatMarker(marker: PeakValleyMarker | null) {
  if (!marker) {
    return "--";
  }

  return `${marker.label} / ${marker.value.toFixed(1)}`;
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

  const chartData = buildChartData(weekdayProfile, weekendProfile);
  const peak = getPeakValleyMarker(getPeakPoint(chartData));
  const valley = getPeakValleyMarker(getValleyPoint(chartData));
  const isOffline = stationStatus?.isActive === false;
  const maxSlotIndex = Math.max(...chartData.map((point) => point.slotIndex));
  const slotsPerHour = maxSlotIndex > 24 ? maxSlotIndex / 24 : 1;
  const xTicks = [0, 6, 12, 18, 24].map((hour) => hour * slotsPerHour);

  return (
    <Card className="flex h-full md:h-98">
      <CardHeader className="gap-3 px-4.5!">
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle>Average Bikes</CardTitle>
            <div className="text-muted-foreground mt-1 flex items-center gap-3 text-xs font-medium">
              <p>
                <span className="text-chart-5">H:</span> {formatMarker(peak)}
              </p>
              <p>
                <span className="text-destructive">L:</span>{" "}
                {formatMarker(valley)}
              </p>
            </div>
          </div>
          {isOffline ? (
            <Badge variant="offline" aria-label="Offline">
              Offline
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col px-2 pt-0 pb-3 sm:px-4">
        {chartData.length > 0 ? (
          <ChartContainer
            config={peaksChartConfig}
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
                <linearGradient
                  id="bikeAvailabilityFill"
                  x1="0"
                  x2="0"
                  y1="0"
                  y2="1"
                >
                  <stop
                    offset="4%"
                    stopColor="var(--color-bikes)"
                    stopOpacity={0.46}
                  />
                  <stop
                    offset="92%"
                    stopColor="var(--color-bikes)"
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
                  (dataMax) => dataMax,
                ]}
              />
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
                  />
                }
              />
              <Area
                dataKey="bikes"
                type="natural"
                fill="url(#bikeAvailabilityFill)"
                stroke="var(--color-bikes)"
                strokeWidth={3.25}
                dot={false}
                activeDot={{
                  r: 6,
                  fill: "var(--background)",
                  stroke: "var(--color-bikes)",
                  strokeWidth: 2.5,
                }}
              />
            </AreaChart>
          </ChartContainer>
        ) : null}
      </CardContent>
    </Card>
  );
}
