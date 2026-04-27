import { CaretDoubleLeftIcon } from "@phosphor-icons/react/dist/csr/CaretDoubleLeft";
import { CaretDoubleRightIcon } from "@phosphor-icons/react/dist/csr/CaretDoubleRight";
import { CaretDownIcon } from "@phosphor-icons/react/dist/csr/CaretDown";
import { CaretLeftIcon } from "@phosphor-icons/react/dist/csr/CaretLeft";
import { CaretRightIcon } from "@phosphor-icons/react/dist/csr/CaretRight";
import { CaretUpIcon } from "@phosphor-icons/react/dist/csr/CaretUp";
import { CaretUpDownIcon } from "@phosphor-icons/react/dist/csr/CaretUpDown";
import type {
  Column,
  ColumnDef,
  InitialTableState,
  RowData,
} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { type ReactNode, useState } from "react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table";
import { getFuzzySearchScore } from "#/lib/fuzzy-search";
import { cn } from "#/lib/utils";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string;
    cellClassName?: string;
    headerButtonClassName?: string;
    headerClassName?: string;
    sticky?: "left";
  }
}

interface DataTableColumnGroup {
  columnIds: string[];
  label: ReactNode;
  className?: string;
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  columnGroups?: DataTableColumnGroup[];
  searchPlaceholder?: string;
  getSearchText?: (row: TData) => string;
  showSearchInput?: boolean;
  showRowCount?: boolean;
  defaultColumn?: Partial<ColumnDef<TData, unknown>> | undefined;
  initialState?: InitialTableState | undefined;
}

interface SortButtonProps<TData> {
  column: Column<TData>;
  children: ReactNode;
}

interface ResolvedHeaderGroup {
  key: string;
  colSpan: number;
  label: ReactNode;
  className?: string;
}

function SortButton<TData>({ column, children }: SortButtonProps<TData>) {
  const sortDirection = column.getIsSorted();

  return (
    <button
      type="button"
      className={cn(
        "group/sortable -mr-0.5 ml-auto flex items-center gap-1",
        column.columnDef.meta?.headerButtonClassName,
      )}
      onClick={column.getToggleSortingHandler()}
    >
      {children}
      <span
        className={cn(
          sortDirection === "asc"
            ? "text-rose-500"
            : sortDirection === "desc"
              ? "text-emerald-500"
              : "text-muted-foreground group-hover/sortable:text-foreground transition-colors",
        )}
      >
        {sortDirection === "asc" ? (
          <CaretUpIcon />
        ) : sortDirection === "desc" ? (
          <CaretDownIcon />
        ) : (
          <CaretUpDownIcon />
        )}
      </span>
    </button>
  );
}

function resolveDataTableColumnGroups(
  visibleColumnIds: string[],
  columnGroups: DataTableColumnGroup[],
): ResolvedHeaderGroup[] {
  const groupByStartColumnId = new Map(
    columnGroups.map((group) => [group.columnIds[0], group]),
  );
  const resolvedGroups: ResolvedHeaderGroup[] = [];

  let index = 0;

  while (index < visibleColumnIds.length) {
    const columnId = visibleColumnIds[index];
    const group = groupByStartColumnId.get(columnId);

    if (!group) {
      resolvedGroups.push({
        key: `ungrouped:${columnId}`,
        colSpan: 1,
        label: "",
      });
      index += 1;
      continue;
    }

    const visibleGroupColumnIds = group.columnIds.filter((id) =>
      visibleColumnIds.includes(id),
    );
    const matchesVisibleOrder = visibleGroupColumnIds.every(
      (id, offset) => visibleColumnIds[index + offset] === id,
    );

    if (visibleGroupColumnIds.length === 0 || !matchesVisibleOrder) {
      resolvedGroups.push({
        key: `ungrouped:${columnId}`,
        colSpan: 1,
        label: "",
      });
      index += 1;
      continue;
    }

    resolvedGroups.push({
      key: `group:${visibleGroupColumnIds.join(":")}`,
      colSpan: visibleGroupColumnIds.length,
      label: group.label,
      className: group.className,
    });
    index += visibleGroupColumnIds.length;
  }

  return resolvedGroups;
}

function getResolvedColumnGroups<TData>(
  columns: Column<TData, unknown>[],
  columnGroups: DataTableColumnGroup[],
): ResolvedHeaderGroup[] {
  return resolveDataTableColumnGroups(
    columns.map((column) => column.id),
    columnGroups,
  );
}

interface GroupBoundaryInfo {
  dividerIds: Set<string>;
}

function hasStickyLeftDividerBeforeColumn(
  columnId: string,
  visibleColumnIds: string[],
  stickyColumnIds: Set<string>,
) {
  const columnIdx = visibleColumnIds.indexOf(columnId);

  return (
    columnIdx > 0 && stickyColumnIds.has(visibleColumnIds[columnIdx - 1] ?? "")
  );
}

function getStickyCellClasses(
  sticky: "left" | undefined,
  surface: "body" | "header",
) {
  if (sticky !== "left") {
    return undefined;
  }

  return cn(
    "sticky left-0 z-20 bg-clip-border",
    "after:bg-border/70 after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:w-px after:content-['']",
    surface === "body"
      ? "bg-background transition-colors group-hover/row:bg-[var(--table-row-hover)]"
      : "bg-accent",
  );
}

function getGroupBoundaries(
  resolvedGroups: ResolvedHeaderGroup[],
  visibleColumnIds: string[],
): GroupBoundaryInfo {
  const dividerIds = new Set<string>();

  let colIdx = 0;
  for (const group of resolvedGroups) {
    if (group.label) {
      const firstId = visibleColumnIds[colIdx];
      if (colIdx > 0) {
        dividerIds.add(firstId);
      }
    }
    colIdx += group.colSpan;
  }

  return { dividerIds };
}

function ColumnGroupHeaderRow({
  groups,
  stickyColumnIds,
  visibleColumnIds,
}: {
  groups: ResolvedHeaderGroup[];
  stickyColumnIds: Set<string>;
  visibleColumnIds: string[];
}) {
  let cellColIdx = 0;

  return (
    <TableRow className="bg-accent hover:bg-accent">
      {groups.map((group) => {
        const startColumnId = visibleColumnIds[cellColIdx];
        const needsLeftBorder =
          Boolean(group.label) &&
          cellColIdx > 0 &&
          !hasStickyLeftDividerBeforeColumn(
            startColumnId,
            visibleColumnIds,
            stickyColumnIds,
          );
        const isSticky =
          group.colSpan === 1 && stickyColumnIds.has(startColumnId);
        cellColIdx += group.colSpan;

        return (
          <TableHead
            key={group.key}
            colSpan={group.colSpan}
            scope={group.label ? "colgroup" : undefined}
            aria-hidden={group.label ? undefined : true}
            className={cn(
              "h-7 border-b-0 text-center text-xs tracking-wide uppercase md:text-xs",
              needsLeftBorder && "border-border/70 border-l",
              getStickyCellClasses(isSticky ? "left" : undefined, "header"),
              group.className,
            )}
          >
            {group.label}
          </TableHead>
        );
      })}
    </TableRow>
  );
}

function DataTable<TData>({
  columns,
  data,
  columnGroups,
  searchPlaceholder = "Filter rows...",
  getSearchText,
  showSearchInput = true,
  showRowCount = true,
  defaultColumn,
  initialState,
}: DataTableProps<TData>) {
  const [globalFilter, setGlobalFilter] = useState("");
  const safeGetSearchText = getSearchText ?? (() => "");

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, _columnId, filterValue) =>
      getFuzzySearchScore(
        safeGetSearchText(row.original),
        String(filterValue ?? ""),
      ) !== null,
    defaultColumn,
    initialState,
  });
  const visibleLeafColumns = table.getVisibleLeafColumns();
  const visibleColumnIds = visibleLeafColumns.map((column) => column.id);
  const stickyColumnIds = new Set(
    visibleLeafColumns
      .filter((column) => column.columnDef.meta?.sticky === "left")
      .map((column) => column.id),
  );
  const resolvedColumnGroups =
    columnGroups && columnGroups.length > 0
      ? getResolvedColumnGroups(visibleLeafColumns, columnGroups)
      : null;
  const groupBoundaries = resolvedColumnGroups
    ? getGroupBoundaries(resolvedColumnGroups, visibleColumnIds)
    : null;

  return (
    <div className="space-y-4">
      {showSearchInput || showRowCount ? (
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {showSearchInput ? (
            <Input
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full md:max-w-sm"
            />
          ) : null}
          {showRowCount ? (
            <div className="text-muted-foreground text-sm">
              {table.getFilteredRowModel().rows.length.toLocaleString()} results
            </div>
          ) : null}
        </div>
      ) : null}

      <Table className="w-max min-w-full">
        <TableHeader>
          {resolvedColumnGroups ? (
            <ColumnGroupHeaderRow
              groups={resolvedColumnGroups}
              stickyColumnIds={stickyColumnIds}
              visibleColumnIds={visibleColumnIds}
            />
          ) : null}
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className="bg-accent hover:bg-accent"
            >
              {headerGroup.headers.map((header) => {
                const columnId = header.column.id;
                const hasDivider =
                  groupBoundaries?.dividerIds.has(columnId) &&
                  !hasStickyLeftDividerBeforeColumn(
                    columnId,
                    visibleColumnIds,
                    stickyColumnIds,
                  );

                return (
                  <TableHead
                    key={header.id}
                    scope="col"
                    className={cn(
                      "h-10 whitespace-nowrap",
                      hasDivider && "border-border/70 border-l",
                      getStickyCellClasses(
                        header.column.columnDef.meta?.sticky,
                        "header",
                      ),

                      header.column.getIsSorted() && "text-foreground",
                      header.column.columnDef.meta?.className,
                      header.column.columnDef.meta?.headerClassName,
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : (() => {
                          const renderedHeader = flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          );

                          if (header.column.getCanSort()) {
                            return (
                              <SortButton column={header.column}>
                                {renderedHeader}
                              </SortButton>
                            );
                          }

                          return renderedHeader;
                        })()}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      "text-right whitespace-nowrap",
                      groupBoundaries?.dividerIds.has(cell.column.id) &&
                        !hasStickyLeftDividerBeforeColumn(
                          cell.column.id,
                          visibleColumnIds,
                          stickyColumnIds,
                        ) &&
                        "border-border/70 border-l",
                      getStickyCellClasses(
                        cell.column.columnDef.meta?.sticky,
                        "body",
                      ),
                      cell.column.columnDef.meta?.className,
                      cell.column.columnDef.meta?.cellClassName,
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-muted-foreground h-24 text-center"
              >
                No stations match this filter.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="-mt-3 flex items-center justify-end">
        <div className="flex items-center gap-x-1.5">
          <span className="mr-1.5 text-xs tabular-nums">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Go to first page"
            onClick={() => table.firstPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <CaretDoubleLeftIcon />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Go to previous page"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <CaretLeftIcon />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Go to next page"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <CaretRightIcon />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Go to last page"
            onClick={() => table.lastPage()}
            disabled={!table.getCanNextPage()}
          >
            <CaretDoubleRightIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}

export { type DataTableColumnGroup, resolveDataTableColumnGroups, DataTable };
