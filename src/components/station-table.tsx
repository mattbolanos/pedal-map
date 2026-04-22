import type { ColumnDef } from "@tanstack/react-table";
import type { FunctionReturnType } from "convex/server";
import { DataTable } from "#/components/ui/data-table";
import type { api } from "#/integrations/convex/api";
import { getStationRegion } from "#/lib/station-region";
import { Badge } from "./ui/badge";

type StationsData = FunctionReturnType<
  typeof api.pedalMap.getStationsTableData
>;
type StationRow = StationsData["rows"][number];

interface StationTableProps {
  data: StationsData["rows"];
}

export function StationTable({ data }: StationTableProps) {
  return (
    <DataTable
      columns={stationTableColumns}
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
          <span className="tabular-nums">
            {(getValue() as string | number).toLocaleString(undefined, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}
          </span>
        ),
      }}
      initialState={{
        pagination: {
          pageSize: 15,
        },
        sorting: [
          {
            id: "avgDocksAvailable",
            desc: true,
          },
        ],
      }}
    />
  );
}

const stationTableColumns: ColumnDef<StationRow>[] = [
  {
    accessorKey: "name",
    header: "Station",
    cell: ({ row }) => (
      <div>
        <span>{row.original.name}</span>
        {row.original.isActive === false ? (
          <Badge variant="offline" aria-label="Offline" className="ml-2">
            Offline
          </Badge>
        ) : null}
      </div>
    ),
  },
  {
    accessorKey: "avgEbikesAvailable",
    header: "Electric",
  },
  {
    accessorFn: (row) =>
      (row.avgBikesAvailable ?? 0) - (row.avgEbikesAvailable ?? 0),
    id: "classic",
    header: "Classic",
  },
  {
    accessorKey: "avgDocksAvailable",
    header: "Docks",
  },
  {
    accessorKey: "avgDockAvailabilityPct",
    header: "Dock %",
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
