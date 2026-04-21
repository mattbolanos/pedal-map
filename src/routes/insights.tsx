import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { StationTable } from "#/components/station-table";
import { api } from "#/integrations/convex/api";

export const Route = createFileRoute("/insights")({
  component: InsightsPage,
});

function InsightsPage() {
  const data = useQuery(api.pedalMap.getInsightsTableData);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 md:px-8">
      {data ? <StationTable data={data.rows} /> : <div>Loading...</div>}
    </main>
  );
}
