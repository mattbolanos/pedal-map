import { createFileRoute } from "@tanstack/react-router";
import { StationMap } from "#/components/station-map";

export const Route = createFileRoute("/")({
	component: HomePage,
});

function HomePage() {
	return (
		<div className="relative size-full">
			<StationMap />
		</div>
	);
}
