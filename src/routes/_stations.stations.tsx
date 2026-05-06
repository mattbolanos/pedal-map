import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { RouteBreadcrumb } from "#/components/route-breadcrumb";
import { StationTable, StationTableSkeleton } from "#/components/station-table";
import { api } from "#/integrations/convex/api";
import { prewarmStationsTableData } from "#/integrations/convex/root-provider";

const DESCRIPTION =
  "Browse Citi Bike station capacity, bikes, docks, e-bikes, and daily activity summaries across the system.";

export const Route = createFileRoute("/_stations/stations")({
  head: () => ({
    meta: [
      {
        title: "Stations | Pedal Map",
      },
      {
        name: "description",
        content: DESCRIPTION,
      },
      {
        property: "og:title",
        content: "Stations | Pedal Map",
      },
      {
        property: "og:description",
        content: DESCRIPTION,
      },
      {
        name: "twitter:title",
        content: "Stations | Pedal Map",
      },
      {
        name: "twitter:description",
        content: DESCRIPTION,
      },
    ],
  }),
  loader: () => {
    prewarmStationsTableData();
  },
  component: StationsPage,
});

function StationsPage() {
  const data = useQuery(api.pedalMap.getStationsTableData);

  return (
    <>
      <RouteBreadcrumb current="Stations" />
      <h1 className="text-xl font-bold">Stations</h1>
      {data ? <StationTable data={data.rows} /> : <StationTableSkeleton />}
    </>
  );
}
