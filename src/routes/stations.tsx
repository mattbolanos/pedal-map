import { ArrowBendUpLeftIcon } from "@phosphor-icons/react/dist/csr/ArrowBendUpLeft";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { StationTable, StationTableSkeleton } from "#/components/station-table";
import { buttonVariants } from "#/components/ui/button";
import { api } from "#/integrations/convex/api";
import { prewarmStationsTableData } from "#/integrations/convex/root-provider";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/stations")({
  loader: () => {
    prewarmStationsTableData();
  },
  component: StationsPage,
});

function StationsPage() {
  const data = useQuery(api.pedalMap.getStationsTableData);

  return (
    <div className="route-padding max-w-6xl">
      <Link
        to="/"
        aria-label="Go back home"
        className={cn(buttonVariants({ variant: "text" }), "pl-0")}
      >
        <ArrowBendUpLeftIcon className="size-5 md:size-4" />
        Back
      </Link>
      {data ? <StationTable data={data.rows} /> : <StationTableSkeleton />}
    </div>
  );
}
