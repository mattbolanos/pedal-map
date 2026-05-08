import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { ProfileSlot } from "#/components/station/profile.types";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "#/components/ui/chart";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "#/components/ui/empty";

type ComparisonMetricKey = keyof Pick<
  ProfileSlot,
  "avgClassicBikesAvailable" | "avgDocksAvailable" | "avgEbikesAvailable"
>;

interface ComparisonDatum {
  metric: string;
  weekday: number;
  weekend: number;
}

const metricChartConfig = {
  weekday: {
    label: "Weekdays",
    color: "var(--primary)",
  },
  weekend: {
    label: "Weekends",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

function getAverage(slots: ProfileSlot[], key: ComparisonMetricKey) {
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

function hasMetricComparisonData({
  weekdayProfile,
  weekendProfile,
}: {
  weekdayProfile: ProfileSlot[];
  weekendProfile: ProfileSlot[];
}) {
  return comparisonMetrics.some(
    ({ key }) =>
      getAverage(weekdayProfile, key) !== null ||
      getAverage(weekendProfile, key) !== null,
  );
}

export function ComparisonChart({
  weekdayProfile,
  weekendProfile,
}: {
  weekdayProfile: ProfileSlot[];
  weekendProfile: ProfileSlot[];
}) {
  const hasData = hasMetricComparisonData({ weekdayProfile, weekendProfile });
  const data = buildMetricComparisonData({ weekdayProfile, weekendProfile });

  return (
    <Card className="flex h-full md:h-98">
      <CardHeader className="px-4.5!">
        <CardTitle>Weekdays vs Weekends</CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col px-2 pt-0 pb-3 sm:px-4">
        {hasData ? (
          <ChartContainer
            config={metricChartConfig}
            className="[&_.recharts-cartesian-grid_line]:stroke-border/40 flex h-full min-h-0 w-full flex-1 [&_.recharts-legend-wrapper]:pt-2"
            initialDimension={{ width: 520, height: 320 }}
          >
            <BarChart
              accessibilityLayer
              data={data}
              barGap={6}
              barCategoryGap="24%"
              margin={{ top: 12, right: 12, bottom: 4, left: 0 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="metric"
                tickLine={false}
                tickMargin={12}
                axisLine={false}
                tick={{ fill: "var(--foreground)" }}
              />
              <YAxis hide />
              <ChartTooltip
                cursor={{ opacity: 0.28 }}
                content={
                  <ChartTooltipContent
                    className="min-w-44 px-3 py-2"
                    indicator="dot"
                  />
                }
              />
              <Bar
                dataKey="weekday"
                fill="var(--color-weekday)"
                radius={[8, 8, 2, 2]}
              />
              <Bar
                dataKey="weekend"
                fill="var(--color-weekend)"
                radius={[8, 8, 2, 2]}
              />
              <ChartLegend content={<ChartLegendContent />} />
            </BarChart>
          </ChartContainer>
        ) : (
          <Empty className="min-h-74 flex-1 border-0 p-6">
            <EmptyHeader>
              <EmptyTitle>No comparison data</EmptyTitle>
              <EmptyDescription>
                Weekday and weekend averages will appear here once this station
                has enough samples.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}
