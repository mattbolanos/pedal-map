import { useQuery } from "@tanstack/react-query";
import { insightsTableColumns } from "#/components/insights-table-columns";
import { LastUpdated } from "#/components/last-updated";
import { Badge } from "#/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/components/ui/card";
import { DataTable } from "#/components/ui/data-table";
import type {
  InsightsLeaderboardStation,
  PedalMapInsightsData,
} from "#/lib/pedal-map-insights";
import { pedalMapInsightsQueryOptions } from "#/lib/pedal-map-insights";
import { getStationRegion } from "#/lib/station-region";

function compactNumber(value: number | null | undefined) {
  return value === null || value === undefined ? "—" : value.toLocaleString();
}

function percent(value: number | null | undefined) {
  return value === null || value === undefined
    ? "—"
    : `${Math.round(value * 100)}%`;
}

function toEpochSeconds(timestampMs: number | null | undefined) {
  return timestampMs ? Math.floor(timestampMs / 1000) : undefined;
}

function SummaryCard({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{detail}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
}

function LeaderboardCard({
  title,
  description,
  metricLabel,
  stations,
  getMetric,
}: {
  title: string;
  description: string;
  metricLabel: string;
  stations: InsightsLeaderboardStation[];
  getMetric: (station: InsightsLeaderboardStation) => string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {stations.slice(0, 5).map((station) => {
          const region = getStationRegion(
            station.regionId ?? undefined,
            station.stationId,
          );

          return (
            <div
              key={`${title}-${station.stationId}`}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <div className="truncate font-medium">{station.name}</div>
                <div className="flex items-center gap-2">
                  {region ? (
                    <Badge variant={region.badgeVariant}>{region.label}</Badge>
                  ) : (
                    <Badge variant="outline">Unknown</Badge>
                  )}
                  <span className="text-muted-foreground text-xs">
                    {station.stationId}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 text-right">
                <span className="font-medium">{getMetric(station)}</span>
                <span className="text-muted-foreground text-xs">
                  {metricLabel}
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function InsightsContent({ data }: { data: PedalMapInsightsData }) {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 md:px-8">
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Convex</Badge>
              <Badge variant="secondary">
                {data.rows.length.toLocaleString()} station rows
              </Badge>
              {data.latestDate ? (
                <Badge variant="outline">Summary date {data.latestDate}</Badge>
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-semibold tracking-tight">
                Citi Bike insights
              </h1>
              <p className="text-muted-foreground max-w-3xl text-sm md:text-base">
                This table is reading live station availability and rollup
                metrics from the shared Convex deployment via
                <code className="bg-muted mx-1 rounded px-1.5 py-0.5 text-xs">
                  pedalMap:getInsightsTableData
                </code>
                and exposes the leaderboard data alongside per-station table
                rows.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-1 text-sm">
            <LastUpdated
              lastReported={toEpochSeconds(data.currentSummary.sampledAt)}
              className="text-muted-foreground"
            />
            <LastUpdated
              lastReported={toEpochSeconds(
                data.pipeline.availabilityFeedLastUpdated,
              )}
              className="text-muted-foreground"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Stations"
            value={`${data.activeStationCount.toLocaleString()} / ${data.stationCount.toLocaleString()}`}
            detail="Active versus cataloged stations"
          />
          <SummaryCard
            title="Average Live Inventory"
            value={`${compactNumber(data.currentSummary.avgBikesAvailable)} bikes`}
            detail={`${compactNumber(data.currentSummary.avgDocksAvailable)} average docks open`}
          />
          <SummaryCard
            title="Turnover"
            value={compactNumber(data.currentSummary.sumTurnover)}
            detail={`${compactNumber(data.currentSummary.sumInferredDepartures)} departures and ${compactNumber(data.currentSummary.sumInferredArrivals)} arrivals`}
          />
          <SummaryCard
            title="Fleet Pressure"
            value={`${data.currentSummary.emptyStationCount.toLocaleString()} empty`}
            detail={`${data.currentSummary.fullStationCount.toLocaleString()} full at the latest sample`}
          />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <LeaderboardCard
          title="Top Turnover"
          description="Stations with the highest latest daily movement."
          metricLabel="daily turnover"
          stations={data.topTurnoverStations}
          getMetric={(station) => compactNumber(station.sumTurnover)}
        />
        <LeaderboardCard
          title="Reliability Leaders"
          description="Pickup and dropoff reliability combined."
          metricLabel="reliability"
          stations={data.reliabilityLeaders}
          getMetric={(station) => percent(station.reliabilityScore)}
        />
        <LeaderboardCard
          title="Pressure Watch"
          description="Stations spending the most time empty or full."
          metricLabel="pressure"
          stations={data.pressureStations}
          getMetric={(station) => percent(station.pressureScore)}
        />
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Station Table</CardTitle>
            <CardDescription>
              Search by station name, ID, short name, or region. Sort columns to
              explore availability, turnover, reliability, and pressure.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={insightsTableColumns}
              data={data.rows}
              searchPlaceholder="Search stations, IDs, short names, or regions..."
              getSearchText={(row) =>
                [
                  row.name,
                  row.stationId,
                  row.shortName ?? "",
                  row.externalId ?? "",
                  row.regionId ?? "",
                ].join(" ")
              }
            />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

export function InsightsPage() {
  const { data, error, isLoading } = useQuery(pedalMapInsightsQueryOptions);

  if (isLoading) {
    return (
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8 md:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Loading insights</CardTitle>
            <CardDescription>
              Fetching the latest Convex dashboard payload.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8 md:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Insights unavailable</CardTitle>
            <CardDescription>
              {error instanceof Error
                ? error.message
                : "The Convex insights query did not return data."}
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return <InsightsContent data={data} />;
}
