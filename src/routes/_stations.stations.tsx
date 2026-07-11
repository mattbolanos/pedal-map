import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { RouteBreadcrumb } from "#/components/route-breadcrumb";
import { StationTable, StationTableSkeleton } from "#/components/station-table";
import { citiBikeStationsQueryOptions } from "#/lib/citibike";

const DESCRIPTION =
  "Browse live Citi Bike station capacity, bikes, docks, and e-bikes across the system.";

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
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(citiBikeStationsQueryOptions),
  pendingComponent: StationTableSkeleton,
  component: StationsPage,
});

function StationsPage() {
  const { data } = useSuspenseQuery(citiBikeStationsQueryOptions);

  return (
    <>
      <RouteBreadcrumb current="Stations" />
      <h1 className="text-xl font-bold">Stations</h1>
      <StationTable data={data.stations} />
    </>
  );
}
