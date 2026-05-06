import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "#/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "#/components/ui/chart";

export interface PeaksPoint {
  label: string;
  slotIndex: number;
  bikes: number | null;
}

export interface PeakValleyMarker {
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
  chartData,
  isOffline,
  peak,
  valley,
}: {
  chartData: PeaksPoint[];
  currentBikes: number | null;
  isOffline: boolean;
  peak: PeakValleyMarker | null;
  valley: PeakValleyMarker | null;
}) {
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
