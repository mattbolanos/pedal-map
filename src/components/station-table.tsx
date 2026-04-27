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
      "avgOccupancyPct",
      "pressureScore",
      "sumTurnover",
      "sumInferredArrivals",
      "sumInferredDepartures",
    ],
  },
  {
    label: "Latest",
    columnIds: [
      "bikesAvailable",
      "ebikesAvailable",
      "classicBikesAvailable",
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
      term: "Electric %",
      description:
        "Average electric bikes divided by average total bikes for the day. Blank values mean no bikes were available in the averaged samples.",
    },
    {
      id: "occupancy",
      term: "Occ %",
      description:
        "Bikes available divided by station capacity. Average columns use the day's sampled occupancy; latest columns use the most recent station status.",
    },
    {
      id: "dock-availability",
      term: "Dock %",
      description:
        "Docks available divided by station capacity. Capacity comes from station information, with a status-based fallback when needed.",
    },
    {
      id: "pressure",
      term: "Pressure",
      description:
        "Share of today's samples where the station was either empty or full. Requires at least six samples.",
    },
    {
      id: "turnover",
      term: "Turnover",
      description:
        "Sum of inferred arrivals and departures across today's samples, based on changes in bikes available between samples.",
    },
    {
      id: "classic",
      term: "Classic",
      description: "The total number of non-electric bikes available.",
    },
  ],
};

const stationTableColumns: ColumnDef<StationRow>[] = [
  {
    accessorKey: "name",
    header: "Station",
    meta: {
      cellClassName:
        "w-30 min-w-30 max-w-30 md:w-42 md:min-w-42 md:max-w-42 overflow-hidden text-left",
      headerButtonClassName: "ml-0 w-full justify-start",
      headerClassName:
        "w-30 min-w-30 max-w-30 md:w-42 md:min-w-42 md:max-w-42 text-left",
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
    header: "Electric",
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
    header: "Electric %",
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
    accessorKey: "sumTurnover",
    header: "Turnover",
    cell: WholeNumberAvailabilityCell,
  },
  {
    accessorKey: "sumInferredArrivals",
    header: "Arrivals",
    cell: WholeNumberAvailabilityCell,
  },
  {
    accessorKey: "sumInferredDepartures",
    header: "Departures",
    cell: WholeNumberAvailabilityCell,
  },
  {
    accessorKey: "bikesAvailable",
    header: "Bikes",
    cell: WholeNumberAvailabilityCell,
  },
  {
    accessorKey: "ebikesAvailable",
    header: "Electric",
    cell: WholeNumberAvailabilityCell,
  },
  {
    id: "classicBikesAvailable",
    accessorFn: (row) => {
      if (row.bikesAvailable === null || row.ebikesAvailable === null) {
        return null;
      }

      return row.bikesAvailable - row.ebikesAvailable;
    },
    header: "Classic",
    cell: WholeNumberAvailabilityCell,
  },
  {
    accessorKey: "currentOccupancyPct",
    header: "Occ %",
    cell: PercentCell,
  },
];
