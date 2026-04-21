import type { ColumnDef } from "@tanstack/react-table";
import type { FunctionReturnType } from "convex/server";
import { DataTable } from "#/components/ui/data-table";
import type { api } from "#/integrations/convex/api";
import { getStationRegion } from "#/lib/station-region";
import { Badge } from "./ui/badge";

type InsightsData = FunctionReturnType<
  typeof api.pedalMap.getInsightsTableData
>;
type InsightsStationRow = InsightsData["rows"][number];

interface StationTableProps {
  data: InsightsData["rows"];
}

export function StationTable({ data }: StationTableProps) {
  return (
    <DataTable
      columns={insightsTableColumns}
      data={data}
      searchPlaceholder="Search stations..."
      getSearchText={(row) =>
        [
          row.name,
          row.shortName ?? "",
          getStationRegion(row.regionId, row.stationId)?.label ?? "",
        ].join(" ")
      }
      defaultColumn={{
        cell: ({ getValue }) => (
          <span className="tabular-nums">{getValue() as string | number}</span>
        ),
      }}
    />
  );
}

const insightsTableColumns: ColumnDef<InsightsStationRow>[] = [
  {
    accessorKey: "name",
    header: "Station",
  },
  {
    accessorFn: (row) =>
      getStationRegion(row.regionId, row.stationId)?.label ?? "",
    header: "Region",
    cell: ({ row }) => {
      const region = getStationRegion(
        row.original.regionId,
        row.original.stationId,
      );
      return region ? (
        <Badge variant={region.badgeVariant}>{region.label}</Badge>
      ) : null;
    },
  },
  {
    accessorKey: "avgEbikesAvailable",
    header: "Electric",
  },
  {
    accessorFn: (row) =>
      (row.avgBikesAvailable ?? 0) - (row.avgEbikesAvailable ?? 0),
    header: "Classic",
  },
  {
    accessorKey: "avgDocksAvailable",
    header: "Open Docks",
  },
  {
    accessorKey: "avgDockAvailabilityPct",
    header: "Open Dock %",
    cell: ({ getValue }) => {
      const value = getValue() as number | null;

      if (value === null) {
        return <span className="tabular-nums">N/A</span>;
      }

      return (
        <span className="tabular-nums">
          {value.toLocaleString(undefined, {
            maximumFractionDigits: 1,
            minimumFractionDigits: 1,
            style: "percent",
          })}
        </span>
      );
    },
  },
];
