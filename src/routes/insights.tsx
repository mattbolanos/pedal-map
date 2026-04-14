import { createFileRoute } from "@tanstack/react-router";
import { InsightsPage } from "#/components/insights-page";

export const Route = createFileRoute("/insights")({
  component: InsightsPage,
});
