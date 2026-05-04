import { Link, useNavigate } from "@tanstack/react-router";
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
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { ClearableInput } from "./ui/clearable-input";
import { Skeleton } from "./ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

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

const STATION_TABLE_SKELETON_COLUMNS = [
  { key: "station", label: "Station" },
  { key: "avg-bikes", label: "Bikes" },
  { key: "avg-electric", label: "Electric" },
  { key: "avg-electric-percent", label: "Electric %" },
  { key: "pressure", label: "Pressure" },
  { key: "turnover", label: "Turnover" },
  { key: "arrivals", label: "Arrivals" },
  { key: "departures", label: "Departures" },
  { key: "avg-occupancy", label: "Occ %" },
  { key: "latest-bikes", label: "Bikes" },
  { key: "latest-electric", label: "Electric" },
  { key: "latest-classic", label: "Classic" },
  { key: "latest-occupancy", label: "Occ %" },
] as const;

const STATION_TABLE_SKELETON_GROUPS = [
  { key: "station", label: "", colSpan: 1 },
  { key: "average", label: "Average", colSpan: 8 },
  { key: "latest", label: "Latest", colSpan: 4 },
] as const;

const STATION_TABLE_SKELETON_ROWS = Array.from(
  { length: 10 },
  (_, index) => `station-table-skeleton-row-${index}`,
);

const STATION_TABLE_MOBILE_SKELETON_ROWS = Array.from(
  { length: 6 },
  (_, index) => `station-table-mobile-skeleton-row-${index}`,
);

const STATION_TABLE_MOBILE_METRICS = Array.from(
  { length: 6 },
  (_, index) => `station-table-mobile-skeleton-metric-${index}`,
);

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
  const navigate = useNavigate();

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
      getMobileCardAction={(row) => ({
        ariaLabel: `View ${row.name} station profile`,
        onClick: () =>
          navigate({
            to: "/stations/$id",
            params: { id: row.stationId },
          }),
      })}
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

export function StationTableSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-live="polite">
      <div className="flex items-center gap-2">
        <ClearableInput
          disabled
          value=""
          placeholder="Search stations..."
          clearLabel="Clear table search"
          className="w-full rounded-[10px] sm:max-w-sm"
        />
      </div>
      <div className="md:hidden">
        <div className="mb-3 flex items-center gap-2">
          <Skeleton className="h-9 min-w-0 flex-1" />
          <Button
            type="button"
            size="icon-sm"
            disabled
            aria-label="Sort selected column descending"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {STATION_TABLE_MOBILE_SKELETON_ROWS.map((row) => (
            <Card key={row} size="sm" className="gap-2.5 rounded-xl">
              <CardHeader>
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {STATION_TABLE_MOBILE_METRICS.map((metric) => (
                    <div
                      key={`${row}-${metric}`}
                      className="flex min-w-0 flex-col items-center gap-1.5 px-1"
                    >
                      <Skeleton className="h-3 w-12 max-w-full" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <div className="hidden md:block">
        <Table className="w-max min-w-full">
          <TableHeader>
            <TableRow className="bg-accent hover:bg-accent">
              {STATION_TABLE_SKELETON_GROUPS.map((group) => (
                <TableHead
                  key={group.key}
                  colSpan={group.colSpan}
                  aria-hidden={group.label ? undefined : true}
                  className="text-foreground h-7 border-b-0 text-center tracking-wide uppercase"
                >
                  {group.label}
                </TableHead>
              ))}
            </TableRow>
            <TableRow className="bg-accent hover:bg-accent">
              {STATION_TABLE_SKELETON_COLUMNS.map((column) => (
                <TableHead
                  key={column.key}
                  scope="col"
                  className="h-9 whitespace-nowrap"
                >
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {STATION_TABLE_SKELETON_ROWS.map((row) => (
              <TableRow key={row}>
                {STATION_TABLE_SKELETON_COLUMNS.map((column) => (
                  <TableCell
                    key={`${row}-${column.key}`}
                    className="text-right whitespace-nowrap"
                  >
                    <Skeleton
                      className={
                        column.key === "station"
                          ? "h-5 w-36 md:w-44"
                          : "ml-auto h-5 w-10"
                      }
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="-mt-1 flex items-center justify-between">
        <Skeleton className="hidden h-8 w-24 md:block" />
        <div className="flex w-full items-center justify-between gap-x-3 md:ml-auto md:w-fit md:justify-end">
          <Skeleton className="h-4 w-28" />
          <div className="ml-auto flex items-center gap-x-1.5">
            <Button type="button" variant="outline" size="icon-sm" disabled />
            <Button type="button" variant="outline" size="icon-sm" disabled />
            <Button type="button" variant="outline" size="icon-sm" disabled />
            <Button type="button" variant="outline" size="icon-sm" disabled />
          </div>
        </div>
      </div>
    </div>
  );
}

const stationTableColumnGroups: DataTableColumnGroup[] = [
  {
    label: "Average",
    columnIds: [
      "avgBikesAvailable",
      "avgEbikesAvailable",
      "avgEbikeShare",
      "pressureScore",
      "sumTurnover",
      "sumInferredArrivals",
      "sumInferredDepartures",
      "avgOccupancyPct",
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
        <span className="md:hidden">{row.original.name}</span>
        <Badge
          variant={
            getStationRegion(row.original.regionId, row.original.stationId)
              ?.badgeVariant
          }
          className="ml-auto md:hidden"
        >
          {
            getStationRegion(row.original.regionId, row.original.stationId)
              ?.label
          }
        </Badge>
        <Link
          to="/stations/$id"
          params={{ id: row.original.stationId }}
          aria-label={`View ${row.original.name} station profile`}
          className="focus-visible:border-ring focus-visible:ring-ring/50 hidden min-w-0 truncate rounded-sm font-medium transition-colors outline-none hover:text-teal-500/80 focus-visible:ring-[3px] md:block"
        >
          {row.original.name}
        </Link>
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
    accessorKey: "avgOccupancyPct",
    header: "Occ %",
    cell: PercentCell,
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
