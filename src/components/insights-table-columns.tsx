import type { Column, ColumnDef } from "@tanstack/react-table";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import type { InsightsStationRow } from "#/lib/pedal-map-insights";
import {
  getStationRegion,
  type StationRegionBadgeVariant,
} from "#/lib/station-region";

function numberOrDash(value: number | null) {
  return value === null ? "—" : value.toLocaleString();
}

function compactNumber(value: number | null) {
  return value === null ? "—" : value.toLocaleString();
}

function percentOrDash(value: number | null) {
  return value === null ? "—" : `${Math.round(value * 100)}%`;
}

function formatTimestamp(timestampMs: number | null) {
  if (timestampMs === null) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestampMs));
}

function SortButton({
  column,
  children,
}: {
  column: Column<InsightsStationRow>;
  children: string;
}) {
  const sortDirection = column.getIsSorted();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-ml-3"
      onClick={() => column.toggleSorting(sortDirection === "asc")}>
      {children}
      <span className="text-muted-foreground min-w-3 text-xs">
        {sortDirection === "asc" ? "↑" : sortDirection === "desc" ? "↓" : ""}
      </span>
    </Button>
  );
}

function RegionBadge({
  stationId,
  regionId,
}: {
  stationId: string;
  regionId: string | null;
}) {
  const region = getStationRegion(regionId ?? undefined, stationId);

  if (!region) {
    return <Badge variant="outline">Unknown</Badge>;
  }

  return (
    <Badge variant={region.badgeVariant as StationRegionBadgeVariant}>
      {region.label}
    </Badge>
  );
}

function StatusBadge(row: InsightsStationRow) {
  if (row.isEmpty) {
    return <Badge variant="destructive">Empty</Badge>;
  }

  if (row.isFull) {
    return <Badge variant="destructive">Full</Badge>;
  }

  if (row.isInstalled && row.isRenting && row.isReturning) {
    return <Badge variant="secondary">Live</Badge>;
  }

  return <Badge variant="outline">Limited</Badge>;
}

function ReliabilityBadge({ value }: { value: number | null }) {
  if (value === null) {
    return <Badge variant="outline">N/A</Badge>;
  }

  if (value >= 0.9) {
    return <Badge variant="secondary">{percentOrDash(value)}</Badge>;
  }

  if (value >= 0.75) {
    return <Badge variant="outline">{percentOrDash(value)}</Badge>;
  }

  return <Badge variant="destructive">{percentOrDash(value)}</Badge>;
}

function PressureBadge({ value }: { value: number | null }) {
  if (value === null) {
    return <Badge variant="outline">N/A</Badge>;
  }

  if (value >= 0.25) {
    return <Badge variant="destructive">{percentOrDash(value)}</Badge>;
  }

  if (value >= 0.1) {
    return <Badge variant="outline">{percentOrDash(value)}</Badge>;
  }

  return <Badge variant="secondary">{percentOrDash(value)}</Badge>;
}

export const insightsTableColumns: ColumnDef<InsightsStationRow>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <SortButton column={column}>Station</SortButton>,
    cell: ({ row }) => (
      <div className="flex min-w-52 flex-col gap-1">
        <div className="font-medium">{row.original.name}</div>
        <div className="text-muted-foreground text-xs">
          {row.original.stationId}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "regionId",
    header: ({ column }) => <SortButton column={column}>Region</SortButton>,
    cell: ({ row }) => (
      <RegionBadge
        stationId={row.original.stationId}
        regionId={row.original.regionId}
      />
    ),
  },
  {
    accessorKey: "bikesAvailable",
    header: ({ column }) => <SortButton column={column}>Bikes</SortButton>,
    cell: ({ row }) => numberOrDash(row.original.bikesAvailable),
  },
  {
    accessorKey: "docksAvailable",
    header: ({ column }) => <SortButton column={column}>Docks</SortButton>,
    cell: ({ row }) => numberOrDash(row.original.docksAvailable),
  },
  {
    accessorKey: "currentOccupancyPct",
    header: ({ column }) => <SortButton column={column}>Occupancy</SortButton>,
    cell: ({ row }) => percentOrDash(row.original.currentOccupancyPct),
  },
  {
    accessorKey: "sumTurnover",
    header: ({ column }) => (
      <SortButton column={column}>Daily Turnover</SortButton>
    ),
    cell: ({ row }) => compactNumber(row.original.sumTurnover),
  },
  {
    accessorKey: "reliabilityScore",
    header: ({ column }) => (
      <SortButton column={column}>Reliability</SortButton>
    ),
    cell: ({ row }) => (
      <ReliabilityBadge value={row.original.reliabilityScore} />
    ),
  },
  {
    accessorKey: "pressureScore",
    header: ({ column }) => <SortButton column={column}>Pressure</SortButton>,
    cell: ({ row }) => <PressureBadge value={row.original.pressureScore} />,
  },
  {
    accessorKey: "sampledAt",
    header: ({ column }) => <SortButton column={column}>Updated</SortButton>,
    cell: ({ row }) => (
      <div className="flex flex-col gap-1">
        <span>{formatTimestamp(row.original.sampledAt)}</span>
        <div className="text-xs">{StatusBadge(row.original)}</div>
      </div>
    ),
  },
];
