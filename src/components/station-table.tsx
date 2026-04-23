import type { ColumnDef } from "@tanstack/react-table";
import type { FunctionReturnType } from "convex/server";
import {
  DataTable,
  type DataTableColumnGroup,
} from "#/components/ui/data-table";
import type { api } from "#/integrations/convex/api";
import { getStationRegion } from "#/lib/station-region";
import { ColorCell } from "./color-cell";
import { Badge } from "./ui/badge";

type StationsData = FunctionReturnType<
  typeof api.pedalMap.getStationsTableData
>;
type StationRow = StationsData["rows"][number];

const PERCENT_COLUMN_IDS = new Set([
  "avgDockAvailabilityPct",
  "avgOccupancyPct",
  "pickupReliabilityPct",
  "dropoffReliabilityPct",
]);

interface StationTableProps {
  data: StationsData["rows"];
}

function clampRatio(ratio: number): number {
  return Math.max(0, Math.min(1, ratio));
}

function getCapacityRatio(value: number | null, capacity: number | null) {
  if (value === null || capacity === null || capacity <= 0) {
    return null;
  }

  return clampRatio(value / capacity);
}

function getColumnColorRatio(
  columnId: string,
  value: number | null,
  row: StationRow,
) {
  if (PERCENT_COLUMN_IDS.has(columnId)) {
    return value === null ? null : clampRatio(value);
  }

  return getCapacityRatio(value, row.capacity);
}

function renderPercentCell(columnId: string) {
  return function PercentCell({
    getValue,
    row,
  }: {
    getValue: () => unknown;
    row: { original: StationRow };
  }) {
    const value = getValue() as number | null;

    return (
      <ColorCell
        active={row.original.isActive}
        formatOptions={{
          maximumFractionDigits: 1,
          minimumFractionDigits: 1,
          style: "percent",
        }}
        ratio={getColumnColorRatio(columnId, value, row.original)}
        value={value}
      />
    );
  };
}

export function StationTable({ data }: StationTableProps) {
  return (
    <DataTable
      columns={stationTableColumns}
      columnGroups={stationTableColumnGroups}
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
        cell: ({ column, getValue, row }) => {
          const value = getValue() as number | null;

          return (
            <ColorCell
              active={row.original.isActive}
              ratio={getColumnColorRatio(column.id, value, row.original)}
              value={value}
            />
          );
        },
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

const stationTableColumnGroups: DataTableColumnGroup[] = [
  {
    label: "Available Now",
    columnIds: [
      "bikesAvailable",
      "ebikesAvailable",
      "classicBikesAvailable",
      "docksAvailable",
    ],
  },
  {
    label: "Avg Availability",
    columnIds: [
      "avgBikesAvailable",
      "avgEbikesAvailable",
      "avgClassicBikesAvailable",
      "avgDocksAvailable",
      "avgDockAvailabilityPct",
      "avgOccupancyPct",
    ],
  },
];

const stationTableColumns: ColumnDef<StationRow>[] = [
  {
    accessorKey: "name",
    header: "Station",
    meta: {
      className: "text-left ml-0",
    },
    cell: ({ row }) => (
      <div className="w-48">
        <span className="text-sm text-[14px]">{row.original.name}</span>
        {row.original.isActive === false ? (
          <Badge variant="offline" aria-label="Offline" className="ml-2">
            Offline
          </Badge>
        ) : null}
      </div>
    ),
  },

  {
    accessorKey: "capacity",
    header: "Capacity",
    cell: ({ getValue }) => {
      const value = getValue() as number | null;

      return (
        <span className="tabular-nums">
          {value === null ? "--" : value.toLocaleString()}
        </span>
      );
    },
  },
  {
    accessorKey: "bikesAvailable",
    header: "Bikes",
  },
  {
    accessorKey: "ebikesAvailable",
    header: "Electric",
  },
  {
    accessorFn: (row) => (row.bikesAvailable ?? 0) - (row.ebikesAvailable ?? 0),
    id: "classicBikesAvailable",
    header: "Classic",
  },
  {
    accessorKey: "docksAvailable",
    header: "Docks",
  },
  {
    accessorKey: "avgBikesAvailable",
    header: "Bikes",
  },
  {
    accessorKey: "avgEbikesAvailable",
    header: "Electric",
  },
  {
    accessorFn: (row) =>
      (row.avgBikesAvailable ?? 0) - (row.avgEbikesAvailable ?? 0),
    id: "avgClassicBikesAvailable",
    header: "Classic",
  },
  {
    accessorKey: "avgDocksAvailable",
    header: "Docks",
  },
  {
    accessorKey: "avgDockAvailabilityPct",
    header: "Dock %",
    cell: renderPercentCell("avgDockAvailabilityPct"),
  },
  {
    accessorKey: "avgOccupancyPct",
    header: "Occ %",
    cell: renderPercentCell("avgOccupancyPct"),
  },
];
