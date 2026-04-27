import type { CellContext, ColumnDef } from "@tanstack/react-table";
import type { FunctionReturnType } from "convex/server";
import {
  DataTable,
  type DataTableColumnGroup,
  type DataTableGlossary,
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

const WHOLE_NUMBER_FORMAT: Intl.NumberFormatOptions = {
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
};

function PercentCell({ getValue, row }: CellContext<StationRow, unknown>) {
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
}

function WholeNumberAvailabilityCell({
  getValue,
  row,
}: CellContext<StationRow, unknown>) {
  const value = getValue() as number | null;

  return (
    <ColorCell
      active={row.original.isActive}
      formatOptions={WHOLE_NUMBER_FORMAT}
      ratio={getCapacityRatio(value, row.original.capacity)}
      value={value}
    />
  );
}

export function StationTable({ data }: StationTableProps) {
  return (
    <DataTable
      columns={stationTableColumns}
      columnGroups={stationTableColumnGroups}
      data={data}
      glossary={stationTableGlossary}
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
        sorting: [
          {
            id: "avgBikesAvailable",
            desc: true,
          },
        ],
      }}
    />
  );
}

const stationTableColumnGroups: DataTableColumnGroup[] = [
  {
    label: "Average",
    columnIds: [
      "avgBikesAvailable",
      "avgEbikesAvailable",
      "avgEbikeShare",
      "avgDocksAvailable",
      "avgDockAvailabilityPct",
      "avgOccupancyPct",
      "pressureScore",
    ],
  },
  {
    label: "Latest",
    columnIds: [
      "bikesAvailable",
      "ebikesAvailable",
      "currentEbikeShare",
      "currentOccupancyPct",
    ],
  },
];

const stationTableGlossary: DataTableGlossary = {
  title: "Station Metrics",
  triggerLabel: "Glossary",
  items: [
    {
      id: "e-bike-share",
      term: "E-Bike %",
      description:
        "Share of available bikes that are electric bikes. Blank values mean no bikes are currently available.",
    },
    {
      id: "occupancy",
      term: "Occ %",
      description:
        "Share of station capacity currently occupied by bikes. Higher values mean fewer open docks.",
    },
    {
      id: "dock-availability",
      term: "Dock %",
      description:
        "Average share of capacity available as open docks. Higher values usually mean easier returns.",
    },
    {
      id: "pressure",
      term: "Pressure",
      description:
        "Relative station demand signal. Higher values indicate stations that more often run tight on bikes or docks.",
    },
  ],
};

const stationTableColumns: ColumnDef<StationRow>[] = [
  {
    accessorKey: "name",
    header: "Station",
    meta: {
      cellClassName:
        "w-30 min-w-30 max-w-30 md:w-48 md:min-w-48 md:max-w-48 overflow-hidden text-left",
      headerButtonClassName: "ml-0 w-full justify-start",
      headerClassName:
        "w-30 min-w-30 max-w-30 md:w-48 md:min-w-48 md:max-w-48 text-left",
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
    cell: PercentCell,
  },
  {
    accessorKey: "avgDockAvailabilityPct",
    header: "Dock %",
    cell: PercentCell,
  },
  {
    accessorKey: "avgOccupancyPct",
    header: "Occ %",
    cell: PercentCell,
  },
  {
    accessorKey: "pressureScore",
    header: "Pressure",
    cell: PercentCell,
  },
  {
    accessorKey: "bikesAvailable",
    header: "Bikes",
    cell: WholeNumberAvailabilityCell,
  },
  {
    accessorKey: "ebikesAvailable",
    header: "E-Bikes",
    cell: WholeNumberAvailabilityCell,
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
    cell: PercentCell,
  },
  {
    accessorKey: "currentOccupancyPct",
    header: "Occ %",
    cell: PercentCell,
  },
];
