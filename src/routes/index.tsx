import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { citiBikeStationsQueryOptions } from "#/lib/citibike";

const LazyStationMap = lazy(async () => {
	const module = await import("#/components/station-map");

	return {
		default: module.StationMap,
	};
});

export const Route = createFileRoute("/")({
	loader: async ({ context }) => {
		const stationData = await context.queryClient.ensureQueryData(
			citiBikeStationsQueryOptions,
		);

		return {
			stationCount: stationData.stations.length,
		};
	},
	component: HomePage,
});

function HomePage() {
	const { stationCount } = Route.useLoaderData();

	return (
		<ClientOnly fallback={<StationMapFallback stationCount={stationCount} />}>
			<Suspense fallback={<StationMapFallback stationCount={stationCount} />}>
				<LazyStationMap />
			</Suspense>
		</ClientOnly>
	);
}

function StationMapFallback({ stationCount }: { stationCount: number }) {
	return (
		<div className="relative size-full overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(110,231,183,0.16),_transparent_38%),linear-gradient(180deg,_rgba(7,16,24,0.98),_rgba(4,10,16,1))]">
			<div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-position:center] [background-size:56px_56px]" />
			<div className="relative flex size-full flex-col justify-between p-4 md:p-6">
				<div className="flex items-start justify-between gap-3">
					<div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 backdrop-blur">
						<p className="text-[0.65rem] font-medium uppercase tracking-[0.24em] text-white/55">
							Live stations
						</p>
						<p className="mt-2 text-3xl font-semibold text-white md:text-4xl">
							{stationCount.toLocaleString("en-US")}
						</p>
					</div>
					<div className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-medium text-emerald-100">
						Loading map
					</div>
				</div>

				<div className="max-w-md space-y-3">
					<div className="h-3 w-40 rounded-full bg-white/12" />
					<div className="h-10 w-full rounded-full bg-white/10" />
					<div className="grid grid-cols-3 gap-2">
						<div className="h-24 rounded-2xl bg-white/8" />
						<div className="h-24 rounded-2xl bg-white/8" />
						<div className="h-24 rounded-2xl bg-white/8" />
					</div>
				</div>
			</div>
		</div>
	);
}
