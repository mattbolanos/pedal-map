import { createFileRoute } from "@tanstack/react-router";
import { api } from "#/integrations/convex/api";
import { convex } from "#/integrations/convex/root-provider";

const STATION_PROFILE_DAYS = 30;

export const Route = createFileRoute("/stations_/$id")({
  loader: async ({ params }) => {
    const profile = await convex.query(
      api.pedalMap.getStationAvailabilityProfile,
      {
        days: STATION_PROFILE_DAYS,
        stationId: params.id,
      },
    );

    return {
      stationName: profile.station?.name ?? null,
    };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData?.stationName ?? `Station`} | Pedal Map`,
      },
    ],
  }),
  component: StationDetailPage,
});

function StationDetailPage() {
  const { id } = Route.useParams();

  return <main className="route-padding max-w-6xl">Station {id}</main>;
}
