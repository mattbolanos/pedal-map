import NumberFlow, { NumberFlowGroup } from "@number-flow/react";
import { BicycleIcon } from "@phosphor-icons/react/dist/csr/Bicycle";
import { ChargingStationIcon } from "@phosphor-icons/react/dist/csr/ChargingStation";
import type { CSSProperties, ReactNode } from "react";
import type { StationRow } from "#/components/station/profile.types";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { availabilityColorCss } from "#/lib/station-pin";
import { cn } from "#/lib/utils";
import { Progress } from "#/components/ui/progress";

type RankStyle = CSSProperties & {
  "--rank-color"?: string;
};

interface StationRanksProps {
  station: StationRow;
  stationCount: number;
}

interface RankMetric {
  label: string;
  rankKey: keyof StationRow["ranks"];
  valueKey: keyof StationRow;
  valuePrecision: "decimal" | "integer";
  icon: ReactNode;
}

function getRankPercent(rank: number | null, stationCount: number) {
  if (rank === null || stationCount <= 1) {
    return 0;
  }

  return Math.max(0, Math.min(1, (stationCount - rank) / (stationCount - 1)));
}

function formatOrdinal(n: number): string {
  const abs = Math.abs(n);
  const lastTwo = abs % 100;

  const suffix =
    lastTwo >= 11 && lastTwo <= 13
      ? "th"
      : abs % 10 === 1
        ? "st"
        : abs % 10 === 2
          ? "nd"
          : abs % 10 === 3
            ? "rd"
            : "th";

  return `${n}${suffix}`;
}

const RANK_GROUPS: { title: string; metrics: RankMetric[] }[] = [
  {
    title: "Latest Ranks",
    metrics: [
      {
        label: "Bikes",
        rankKey: "currentBikesAvailable",
        valueKey: "bikesAvailable",
        valuePrecision: "integer",
        icon: <BicycleIcon className="size-5" />,
      },
      {
        label: "Electrics",
        rankKey: "currentEbikesAvailable",
        valueKey: "ebikesAvailable",
        valuePrecision: "integer",
        icon: <ChargingStationIcon className="size-5" />,
      },
    ],
  },
  {
    title: "Average Ranks",
    metrics: [
      {
        label: "Bikes",
        rankKey: "avgBikesAvailable",
        valueKey: "avgBikesAvailable",
        valuePrecision: "decimal",
        icon: <BicycleIcon className="size-5" />,
      },
      {
        label: "Electrics",
        rankKey: "avgEbikesAvailable",
        valueKey: "avgEbikesAvailable",
        valuePrecision: "decimal",
        icon: <ChargingStationIcon className="size-5" />,
      },
    ],
  },
];

export function StationRanks({ station, stationCount }: StationRanksProps) {
  return (
    <>
      {RANK_GROUPS.map((group) => (
        <Card key={group.title} className="pb-3!">
          <CardHeader className="px-4.5!">
            <CardTitle>{group.title}</CardTitle>
          </CardHeader>
          <CardContent className="px-3.5!">
            <NumberFlowGroup>
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
                {group.metrics.map((metric) => (
                  <RankMetricItem
                    key={metric.rankKey}
                    metric={metric}
                    station={station}
                    stationCount={stationCount}
                  />
                ))}
              </div>
            </NumberFlowGroup>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

function RankMetricItem({
  metric,
  station,
  stationCount,
}: {
  metric: RankMetric;
  station: StationRow;
  stationCount: number;
}) {
  const rank = station.ranks[metric.rankKey];

  const rankPercent = getRankPercent(rank, stationCount);
  const isRanked = rank !== null;
  const rankStyle: RankStyle = isRanked
    ? { "--rank-color": availabilityColorCss(rankPercent, true) }
    : {};

  const rankLabel =
    rank === null
      ? "Unranked"
      : `${formatOrdinal(Math.round(rankPercent * 100))} percentile`;

  return (
    <div
      className="grid min-h-26 grid-rows-[auto_1fr_auto] px-1.5 py-2.5"
      style={rankStyle}
    >
      <div className="text-muted-foreground flex items-center gap-x-1.5 text-sm">
        {metric.icon}
        <span>{metric.label}</span>
      </div>

      <div className="flex items-end justify-between gap-3 pt-3">
        <div className="leading-none">
          {rank === null ? (
            <span className="text-muted-foreground text-2xl font-semibold tabular-nums">
              --
            </span>
          ) : (
            <NumberFlow
              value={rank}
              locales="en-US"
              trend={0}
              prefix="#"
              className="text-2xl font-semibold text-[var(--rank-color)] tabular-nums"
            />
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Progress
          value={rankPercent * 100}
          indicatorClassName={cn(isRanked && "bg-[var(--rank-color)]")}
          trackClassName="bg-secondary"
        />
        <div
          className={cn(
            "text-sm tabular-nums",
            isRanked ? "text-[var(--rank-color)]" : "text-muted-foreground",
          )}
        >
          {rankLabel}
        </div>
      </div>
    </div>
  );
}
