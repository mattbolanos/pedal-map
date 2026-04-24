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

function renderNumberCell(
  formatOptions?: Intl.NumberFormatOptions,
  className = "tabular-nums",
) {
  return function NumberCell({ getValue }: { getValue: () => unknown }) {
    const value = getValue() as number | null;

    return (
      <span className={className}>
        {value === null ? "--" : value.toLocaleString(undefined, formatOptions)}
      </span>
    );
  };
}

function renderPercentCell() {
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
        ratio={value}
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
        cell: ({ getValue, row }) => {
          const value = getValue() as number | null;

          return (
            <ColorCell
              active={row.original.isActive}
              ratio={getCapacityRatio(value, row.original.capacity)}
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
            id: "bikesAvailable",
            desc: true,
          },
        ],
      }}
    />
  );
}

const stationTableColumnGroups: DataTableColumnGroup[] = [
  {
    label: "Latest",
    columnIds: [
      "capacity",
      "bikesAvailable",
      "ebikesAvailable",
      "currentEbikeShare",
    ],
  },
  {
    label: "Average",
    columnIds: [
      "avgBikesAvailable",
      "avgEbikesAvailable",
      "avgEbikeShare",
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
      cellClassName:
        "w-36 min-w-36 max-w-36 md:w-48 md:min-w-48 md:max-w-48 overflow-hidden text-left",
      headerButtonClassName: "ml-0 w-full justify-start",
      headerClassName:
        "w-36 min-w-36 max-w-36 md:w-48 md:min-w-48 md:max-w-48 text-left",
      sticky: "left",
    },
    cell: ({ row }) => (
      <div
        className="flex w-full min-w-0 items-center gap-2"
        title={row.original.name}
      >
        <span className="block min-w-0 truncate">{row.original.name}</span>
        {row.original.isActive === false ? (
          <Badge variant="offline" aria-label="Offline" className="shrink-0">
            Offline
          </Badge>
        ) : null}
      </div>
    ),
  },

  {
    accessorKey: "capacity",
    header: "Capacity",
    cell: renderNumberCell(),
  },
  {
    accessorKey: "bikesAvailable",
    header: "Bikes",
  },
  {
    accessorKey: "ebikesAvailable",
    header: "E-Bikes",
  },
  {
    accessorFn: (row) => {
      if (
        row.ebikesAvailable === null ||
        row.bikesAvailable === null ||
        row.bikesAvailable <= 0
      ) {
        return null;
      }

      return clampRatio(row.ebikesAvailable / row.bikesAvailable);
    },
    id: "currentEbikeShare",
    header: "E-Bike %",
    cell: renderPercentCell(),
  },
  {
    accessorKey: "avgBikesAvailable",
    header: "Bikes",
  },
  {
    accessorKey: "avgEbikesAvailable",
    header: "E-Bikes",
  },
  {
    accessorFn: (row) => {
      if (
        row.avgEbikesAvailable === null ||
        row.avgBikesAvailable === null ||
        row.avgBikesAvailable <= 0
      ) {
        return null;
      }

      return clampRatio(row.avgEbikesAvailable / row.avgBikesAvailable);
    },
    id: "avgEbikeShare",
    header: "E-Bike %",
    cell: renderPercentCell(),
  },
  {
    accessorKey: "avgDockAvailabilityPct",
    header: "Dock %",
    cell: renderPercentCell(),
  },
  {
    accessorKey: "avgOccupancyPct",
    header: "Occ %",
    cell: renderPercentCell(),
  },
  {
    accessorKey: "sumTurnover",
    header: "Turnover",
  },
];
