import { Link } from "@tanstack/react-router";
import type { CellContext, ColumnDef } from "@tanstack/react-table";
import { DataTable } from "#/components/ui/data-table";
import { prewarmStationAvailabilityProfile } from "#/integrations/convex/root-provider";
import type { CitiBikeStation } from "#/lib/citibike";
import { isStationActive } from "#/lib/station";
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

interface StationTableProps {
  data: CitiBikeStation[];
}

function clampRatio(ratio: number): number {
  return Math.max(0, Math.min(1, ratio));
}

function toNullableNumber(value: number | undefined) {
  return value ?? null;
}

function getCapacityRatio(value: number | undefined, capacity?: number) {
  if (value === undefined || capacity === undefined || capacity <= 0) {
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
  { key: "capacity", label: "Capacity" },
  { key: "bikes", label: "Bikes" },
  { key: "electric", label: "E-bikes" },
  { key: "docks", label: "Docks" },
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
  { length: 4 },
  (_, index) => `station-table-mobile-skeleton-metric-${index}`,
);

function AvailabilityCell({
  getValue,
  row,
}: CellContext<CitiBikeStation, unknown>) {
  const value = getValue() as number | undefined;

  return (
    <ColorCell
      active={isStationActive(row.original)}
      formatOptions={WHOLE_NUMBER_FORMAT}
      ratio={getCapacityRatio(value, row.original.capacity)}
      value={toNullableNumber(value)}
    />
  );
}

function CapacityCell({ getValue }: CellContext<CitiBikeStation, unknown>) {
  const value = getValue() as number | undefined;

  return (
    <span className="tabular-nums">
      {value === undefined ? "--" : value.toLocaleString()}
    </span>
  );
}

function prewarmProfile(stationId: string) {
  prewarmStationAvailabilityProfile(stationId);
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
          row.short_name ?? "",
          getStationRegion(row.region_id, row.station_id)?.label ?? "",
        ].join(" ")
      }
      getMobileCardLink={(row) => ({
        to: "/stations/$id",
        params: { id: row.station_id },
        "aria-label": `View ${row.name} station profile`,
        onFocus: () => prewarmProfile(row.station_id),
        onPointerEnter: () => prewarmProfile(row.station_id),
        onTouchStart: () => prewarmProfile(row.station_id),
      })}
      initialState={{
        sorting: [
          {
            id: "num_bikes_available",
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
                <div className="grid grid-cols-4 gap-3">
                  {STATION_TABLE_MOBILE_METRICS.map((metric) => (
                    <div
                      key={`${row}-${metric}`}
                      className="flex min-w-0 flex-col items-center gap-1.5 px-1">
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
              {STATION_TABLE_SKELETON_COLUMNS.map((column) => (
                <TableHead
                  key={column.key}
                  scope="col"
                  className="h-9 whitespace-nowrap">
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
                    className="text-right whitespace-nowrap">
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

const stationTableColumns: ColumnDef<CitiBikeStation>[] = [
  {
    accessorKey: "name",
    header: "Station",
    meta: {
      cellClassName:
        "w-30 min-w-30 max-w-30 md:w-64 md:min-w-64 md:max-w-64 overflow-hidden text-left",
      headerButtonClassName: "ml-0 w-full justify-start",
      headerClassName:
        "w-30 min-w-30 max-w-30 md:w-64 md:min-w-64 md:max-w-64 text-left",
      sticky: "left",
    },
    cell: ({ row }) => {
      const station = row.original;
      const region = getStationRegion(station.region_id, station.station_id);

      return (
        <div
          className="flex w-full min-w-0 items-center gap-2"
          title={station.name}>
          <span className="md:hidden">{station.name}</span>
          {region ? (
            <Badge variant={region.badgeVariant} className="ml-auto md:hidden">
              {region.label}
            </Badge>
          ) : null}
          <Link
            to="/stations/$id"
            params={{ id: station.station_id }}
            aria-label={`View ${station.name} station profile`}
            onFocus={() => prewarmProfile(station.station_id)}
            onPointerEnter={() => prewarmProfile(station.station_id)}
            className="focus-visible:border-ring focus-visible:ring-ring/50 hidden min-w-0 truncate rounded-sm font-medium transition-colors outline-none hover:text-teal-500/80 focus-visible:ring-[3px] md:block">
            {station.name}
          </Link>
          {!isStationActive(station) ? (
            <Badge variant="offline" aria-label="Offline" className="shrink-0">
              Offline
            </Badge>
          ) : null}
        </div>
      );
    },
  },
  {
    accessorKey: "capacity",
    header: "Capacity",
    cell: CapacityCell,
  },
  {
    accessorKey: "num_bikes_available",
    header: "Bikes",
    cell: AvailabilityCell,
  },
  {
    accessorKey: "num_ebikes_available",
    header: "E-bikes",
    cell: AvailabilityCell,
  },
  {
    accessorKey: "num_docks_available",
    header: "Docks",
    cell: AvailabilityCell,
  },
];
