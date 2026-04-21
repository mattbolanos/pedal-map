import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "#/components/ui/data-table";
import type { InsightsStationRow } from "#/lib/pedal-map-insights";
import { getStationRegion } from "#/lib/station-region";
import { Badge } from "./ui/badge";

interface StationTableProps {
  data: InsightsStationRow[];
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
  },
];
