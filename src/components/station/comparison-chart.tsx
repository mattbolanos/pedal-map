import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "#/components/ui/chart";

export interface ComparisonDatum {
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
    color: "oklch(0.78 0.15 74)",
  },
} satisfies ChartConfig;

export function ComparisonChart({ data }: { data: ComparisonDatum[] }) {
  return (
    <Card className="flex h-full md:h-98">
      <CardHeader className="px-4.5!">
        <CardTitle>Weekdays vs Weekends</CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col px-2 pt-0 pb-3 sm:px-4">
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
      </CardContent>
    </Card>
  );
}
