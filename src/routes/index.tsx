import { createFileRoute } from "@tanstack/react-router";
import { StationMap } from "#/components/station-map";
import { citiBikeStationsQueryOptions } from "#/lib/citibike";

export const Route = createFileRoute("/")({
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(citiBikeStationsQueryOptions),
	component: HomePage,
});

function HomePage() {
	return (
		<div className="relative size-full">
			<StationMap />
		</div>
	);
}
