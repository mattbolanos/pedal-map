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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "#/components/ui/chart";

export interface AvailabilityPoint {
  label: string;
  slotIndex: number;
  weekday: number | null;
  weekend: number | null;
}

export interface PeakMarker {
  label: string;
  value: number;
}

const availabilityChartConfig = {
  weekday: {
    label: "Weekdays",
    color: "oklch(0.62 0.15 224)",
  },
  weekend: {
    label: "Weekends",
    color: "oklch(0.74 0.15 76)",
  },
} satisfies ChartConfig;

function PeakPill({
  label,
  peak,
  tone,
}: {
  label: string;
  peak: PeakMarker | null;
  tone: "weekday" | "weekend";
}) {
  return (
    <div className="bg-accent/50 flex items-center gap-2 rounded-full px-2.5 py-1">
      <span
        className="size-2 rounded-full"
        style={{ background: availabilityChartConfig[tone].color }}
      />
      <span className="text-muted-foreground text-[11px] font-medium">
        {label}
      </span>
      <span className="text-foreground text-[11px] font-semibold tabular-nums">
        {peak ? `${peak.label} / ${peak.value.toFixed(1)}` : "--"}
      </span>
    </div>
  );
}

export function AvailabilityChart({
  chartData,
  chartMax,
  isOffline,
  tickLabels,
  weekdayPeak,
  weekendPeak,
}: {
  chartData: AvailabilityPoint[];
  chartMax: number;
  isOffline: boolean;
  tickLabels: string[];
  weekdayPeak: PeakMarker | null;
  weekendPeak: PeakMarker | null;
}) {
  return (
    <Card className="flex h-full md:h-98">
      <CardHeader className="gap-3 px-4.5!">
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle>Peaks</CardTitle>
          </div>
          {isOffline ? (
            <Badge variant="offline" aria-label="Offline">
              Offline
            </Badge>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <PeakPill label="Weekday peak" peak={weekdayPeak} tone="weekday" />
          <PeakPill label="Weekend peak" peak={weekendPeak} tone="weekend" />
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col px-2 pt-0 pb-3 sm:px-4">
        {chartData.length > 0 ? (
          <ChartContainer
            config={availabilityChartConfig}
            className="[&_.recharts-cartesian-grid_line]:stroke-border/40 flex h-full min-h-0 w-full flex-1 [&_.recharts-legend-wrapper]:pt-2"
            initialDimension={{ width: 720, height: 320 }}
          >
            <AreaChart
              accessibilityLayer
              data={chartData}
              margin={{ top: 12, right: 12, bottom: 4, left: 0 }}
            >
              <defs>
                <linearGradient
                  id="weekdayAvailabilityFill"
                  x1="0"
                  x2="0"
                  y1="0"
                  y2="1"
                >
                  <stop
                    offset="4%"
                    stopColor="var(--color-weekday)"
                    stopOpacity={0.46}
                  />
                  <stop
                    offset="92%"
                    stopColor="var(--color-weekday)"
                    stopOpacity={0.04}
                  />
                </linearGradient>
                <linearGradient
                  id="weekendAvailabilityFill"
                  x1="0"
                  x2="0"
                  y1="0"
                  y2="1"
                >
                  <stop
                    offset="4%"
                    stopColor="var(--color-weekend)"
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="92%"
                    stopColor="var(--color-weekend)"
                    stopOpacity={0.04}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tickMargin={12}
                ticks={tickLabels}
              />
              <YAxis hide domain={[0, chartMax]} />
              <ChartTooltip
                cursor={{
                  stroke: "var(--border)",
                  strokeDasharray: "4 4",
                }}
                content={
                  <ChartTooltipContent
                    className="min-w-44 px-3 py-2"
                    indicator="dot"
                    labelClassName="text-foreground"
                  />
                }
              />
              <Area
                dataKey="weekend"
                type="natural"
                fill="url(#weekendAvailabilityFill)"
                stroke="var(--color-weekend)"
                strokeWidth={3}
                dot={false}
                activeDot={{
                  r: 6,
                  fill: "var(--background)",
                  stroke: "var(--color-weekend)",
                  strokeWidth: 2.5,
                }}
              />
              <Area
                dataKey="weekday"
                type="natural"
                fill="url(#weekdayAvailabilityFill)"
                stroke="var(--color-weekday)"
                strokeWidth={3.25}
                dot={false}
                activeDot={{
                  r: 6,
                  fill: "var(--background)",
                  stroke: "var(--color-weekday)",
                  strokeWidth: 2.5,
                }}
              />
              {weekdayPeak ? (
                <>
                  <ReferenceDot
                    x={weekdayPeak.label}
                    y={weekdayPeak.value}
                    r={11}
                    fill="var(--color-weekday)"
                    fillOpacity={0.16}
                    ifOverflow="extendDomain"
                    stroke="none"
                  />
                  <ReferenceDot
                    x={weekdayPeak.label}
                    y={weekdayPeak.value}
                    r={7}
                    fill="var(--background)"
                    ifOverflow="extendDomain"
                    stroke="var(--color-weekday)"
                    strokeWidth={4}
                  />
                </>
              ) : null}
              {weekendPeak ? (
                <>
                  <ReferenceDot
                    x={weekendPeak.label}
                    y={weekendPeak.value}
                    r={11}
                    fill="var(--color-weekend)"
                    fillOpacity={0.16}
                    ifOverflow="extendDomain"
                    stroke="none"
                  />
                  <ReferenceDot
                    x={weekendPeak.label}
                    y={weekendPeak.value}
                    r={7}
                    fill="var(--background)"
                    ifOverflow="extendDomain"
                    stroke="var(--color-weekend)"
                    strokeWidth={4}
                  />
                </>
              ) : null}
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        ) : null}
      </CardContent>
    </Card>
  );
}
