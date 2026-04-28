import { ArrowBendUpLeftIcon } from "@phosphor-icons/react/dist/csr/ArrowBendUpLeft";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { StationTable, StationTableSkeleton } from "#/components/station-table";
import { buttonVariants } from "#/components/ui/button";
import { api } from "#/integrations/convex/api";
import { prewarmStationsTableData } from "#/integrations/convex/root-provider";
import { cn } from "#/lib/utils";

const DESCRIPTION =
  "Browse Citi Bike station capacity, bikes, docks, e-bikes, and daily activity summaries across the system.";

export const Route = createFileRoute("/stations")({
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
    <div className="route-padding max-w-6xl space-y-3">
      <Link
        to="/"
        aria-label="Go back home"
        className={cn(buttonVariants({ variant: "text" }), "pl-0")}
      >
        <ArrowBendUpLeftIcon className="size-5 md:size-4" />
        Back
      </Link>
      <h1 className="text-xl font-bold">Stations</h1>
      {data ? <StationTable data={data.rows} /> : <StationTableSkeleton />}
    </div>
  );
}
