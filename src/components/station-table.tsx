import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "#/components/ui/data-table";
import type { InsightsStationRow } from "#/lib/pedal-map-insights";

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
          row.stationId,
          row.shortName ?? "",
          row.externalId ?? "",
          row.regionId ?? "",
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
];
