import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
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
    color: "oklch(0.62 0.15 224)",
  },
  weekend: {
    label: "Weekends",
    color: "oklch(0.74 0.15 76)",
  },
} satisfies ChartConfig;

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="h-2 w-2 shrink-0 rounded-[2px]"
        style={{ backgroundColor: color }}
      />
      <span>{label}</span>
    </div>
  );
}

export function ComparisonChart({ data }: { data: ComparisonDatum[] }) {
  return (
    <Card className="flex h-full">
      <CardHeader className="px-4.5!">
        <CardTitle>Weekday vs weekend</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col px-2 pt-0 pb-3 sm:px-4">
        <ChartContainer
          config={metricChartConfig}
          className="[&_.recharts-cartesian-grid_line]:stroke-border/40 h-72 w-full flex-1"
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
            />
            <YAxis hide />
            <ChartTooltip
              cursor={{ fill: "var(--muted)", opacity: 0.28 }}
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
          </BarChart>
        </ChartContainer>
        <div className="mt-auto flex items-center justify-center gap-4 pt-2">
          <LegendItem
            color={metricChartConfig.weekday.color}
            label={String(metricChartConfig.weekday.label)}
          />
          <LegendItem
            color={metricChartConfig.weekend.color}
            label={String(metricChartConfig.weekend.label)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
