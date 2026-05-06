import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_stations")({
  component: StationsLayout,
});

function StationsLayout() {
  return (
    <main className="route-padding max-w-6xl space-y-3">
      <Outlet />
    </main>
  );
}
