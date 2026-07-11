import { queryOptions } from "@tanstack/react-query";
import type { FunctionReturnType } from "convex/server";
import { api } from "#/integrations/convex/api";
import { convex } from "#/integrations/convex/root-provider";

export type StationAverageRanksData = FunctionReturnType<
  typeof api.pedalMap.getLatestStationAverageRanks
>;

export const stationAverageRanksQueryOptions = queryOptions({
  queryKey: ["station-average-ranks"],
  queryFn: () => convex.query(api.pedalMap.getLatestStationAverageRanks, {}),
  staleTime: 6 * 60 * 60 * 1_000,
  gcTime: 24 * 60 * 60 * 1_000,
  refetchOnWindowFocus: false,
});
