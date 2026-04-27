import { ArrowDownIcon } from "@phosphor-icons/react/dist/csr/ArrowDown";
import { ArrowsDownUpIcon } from "@phosphor-icons/react/dist/csr/ArrowsDownUp";
import { ArrowUpIcon } from "@phosphor-icons/react/dist/csr/ArrowUp";
import { BookOpenTextIcon } from "@phosphor-icons/react/dist/csr/BookOpenText";
import { CaretDoubleLeftIcon } from "@phosphor-icons/react/dist/csr/CaretDoubleLeft";
import { CaretDoubleRightIcon } from "@phosphor-icons/react/dist/csr/CaretDoubleRight";
import { CaretLeftIcon } from "@phosphor-icons/react/dist/csr/CaretLeft";
import { CaretRightIcon } from "@phosphor-icons/react/dist/csr/CaretRight";
import type {
  Cell,
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
import { isValidElement, type ReactNode, useState } from "react";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { ClearableInput } from "#/components/ui/clearable-input";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "#/components/ui/drawer";
import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from "#/components/ui/native-select";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "#/components/ui/popover";
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
    mobileHidden?: boolean;
    mobileLabel?: ReactNode;
    mobilePriority?: "title" | "content";
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

interface DataTableGlossaryItem {
  id?: string;
  term: ReactNode;
  description: ReactNode;
}

interface DataTableGlossary {
  items: DataTableGlossaryItem[];
  title?: ReactNode;
  description?: ReactNode;
  triggerLabel?: ReactNode;
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  columnGroups?: DataTableColumnGroup[];
  glossary?: DataTableGlossary;
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

interface SortSelectColumnGroup<TData> {
  key: string;
  label?: string;
  columns: Column<TData, unknown>[];
}

function SortButton<TData>({ column, children }: SortButtonProps<TData>) {
  const sortDirection = column.getIsSorted();
  const buttonClassName = column.columnDef.meta?.headerButtonClassName;
  const headerClassName = column.columnDef.meta?.headerClassName;
  const isLeftAligned =
    buttonClassName?.includes("justify-start") ||
    headerClassName?.includes("text-left");

  return (
    <button
      type="button"
      className={cn(
        "group/sortable ml-auto flex items-center gap-0.5 md:gap-1",
        !isLeftAligned && "flex-row-reverse",
        buttonClassName,
      )}
      onClick={column.getToggleSortingHandler()}
    >
      {children}
      <span
        className={cn(
          "flex w-4 shrink-0 justify-center transition-opacity duration-75",
          sortDirection
            ? "opacity-100"
            : "opacity-0 group-hover/sortable:opacity-100",
        )}
      >
        {sortDirection === "asc" ? (
          <ArrowUpIcon />
        ) : sortDirection === "desc" ? (
          <ArrowDownIcon />
        ) : (
          <ArrowsDownUpIcon />
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

function getPlainTextFromReactNode(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") {
    return "";
  }

  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(getPlainTextFromReactNode).join("");
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    return getPlainTextFromReactNode(node.props.children);
  }

  return "";
}

function getSortSelectColumnGroups<TData>(
  resolvedGroups: ResolvedHeaderGroup[] | null,
  visibleColumns: Column<TData, unknown>[],
): SortSelectColumnGroup<TData>[] {
  const sortableColumnsById = new Map(
    visibleColumns
      .filter((column) => column.getCanSort())
      .map((column) => [column.id, column]),
  );

  if (!resolvedGroups) {
    return [
      {
        key: "ungrouped",
        columns: [...sortableColumnsById.values()],
      },
    ];
  }

  const visibleColumnIds = visibleColumns.map((column) => column.id);
  const selectGroups: SortSelectColumnGroup<TData>[] = [];
  let columnIndex = 0;

  for (const group of resolvedGroups) {
    const groupColumns = visibleColumnIds
      .slice(columnIndex, columnIndex + group.colSpan)
      .map((columnId) => sortableColumnsById.get(columnId))
      .filter((column): column is Column<TData, unknown> => Boolean(column));
    const label = getPlainTextFromReactNode(group.label).trim();

    if (groupColumns.length > 0) {
      selectGroups.push({
        key: group.key,
        label: label || undefined,
        columns: groupColumns,
      });
    }

    columnIndex += group.colSpan;
  }

  return selectGroups;
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

function getMobileColumnLabel<TData>(
  column: Column<TData, unknown>,
): ReactNode {
  const mobileLabel = column.columnDef.meta?.mobileLabel;

  if (mobileLabel) {
    return mobileLabel;
  }

  if (
    typeof column.columnDef.header === "string" ||
    typeof column.columnDef.header === "number"
  ) {
    return column.columnDef.header;
  }

  return column.id;
}

function getMobileCardColumnIds(
  resolvedGroups: ResolvedHeaderGroup[] | null,
  visibleColumnIds: string[],
) {
  if (!resolvedGroups) {
    return new Set(visibleColumnIds.slice(1));
  }

  let columnIndex = 0;

  for (const group of resolvedGroups) {
    const groupColumnIds = visibleColumnIds.slice(
      columnIndex,
      columnIndex + group.colSpan,
    );

    if (group.label && groupColumnIds.length > 0) {
      return new Set(groupColumnIds);
    }

    columnIndex += group.colSpan;
  }

  return new Set(visibleColumnIds.slice(1));
}

function MobileMetricGrid<TData>({ cells }: { cells: Cell<TData, unknown>[] }) {
  return (
    <dl className="grid grid-cols-3 gap-3">
      {cells.map((cell) => (
        <div
          key={cell.id}
          className="flex min-w-0 flex-col items-center gap-1.5 px-1"
        >
          <dt className="text-muted-foreground max-w-full truncate text-[11px] leading-none">
            {getMobileColumnLabel(cell.column)}
          </dt>
          <dd className="text-foreground text-sm leading-none font-medium tabular-nums">
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function MobileDataCard<TData>({
  titleCell,
  metricCells,
}: {
  titleCell: Cell<TData, unknown> | undefined;
  metricCells: Cell<TData, unknown>[];
}) {
  return (
    <Card size="sm" className="gap-2.5 rounded-xl">
      {titleCell ? (
        <CardHeader>
          <CardTitle className="text-sm text-pretty">
            {flexRender(
              titleCell.column.columnDef.cell,
              titleCell.getContext(),
            )}
          </CardTitle>
        </CardHeader>
      ) : null}
      <CardContent>
        <MobileMetricGrid cells={metricCells} />
      </CardContent>
    </Card>
  );
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
              "text-foreground h-7 border-b-0 text-center tracking-wide uppercase",
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

function GlossaryTerms({ glossary }: { glossary: DataTableGlossary }) {
  return (
    <dl className="divide-border/60 divide-y">
      {glossary.items.map((item, index) => (
        <div
          key={item.id ?? String(item.term)}
          className={cn(
            "flex flex-col gap-0.5",
            index === 0 ? "pb-2" : "py-2",
            index === glossary.items.length - 1 && "pb-0",
          )}
        >
          <dt className="text-foreground text-xs leading-5 font-medium">
            {item.term}
          </dt>
          <dd className="text-muted-foreground text-xs leading-5 text-pretty">
            {item.description}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function DataTableGlossaryView({ glossary }: { glossary: DataTableGlossary }) {
  if (glossary.items.length === 0) {
    return null;
  }

  const title = glossary.title ?? "Glossary";
  const description = glossary.description;
  const triggerLabel = glossary.triggerLabel ?? title;

  return (
    <>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="hidden h-8 gap-1.5 md:inline-flex"
            >
              <BookOpenTextIcon />
              {triggerLabel}
            </Button>
          }
        />
        <PopoverContent
          align="end"
          className="w-[min(22rem,calc(100vw-2rem))] gap-3"
        >
          <PopoverHeader>
            <PopoverTitle className="text-sm">{title}</PopoverTitle>
            {description ? (
              <PopoverDescription className="text-xs leading-5">
                {description}
              </PopoverDescription>
            ) : null}
          </PopoverHeader>
          <div className="-mr-2 max-h-[60svh] overflow-y-auto pr-2">
            <GlossaryTerms glossary={glossary} />
          </div>
        </PopoverContent>
      </Popover>
      <Drawer>
        <DrawerTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="bg-background/95 fixed top-11 right-3 z-50 size-9 gap-1.5 shadow-sm backdrop-blur md:hidden md:w-auto"
          >
            <BookOpenTextIcon />
            <span className="hidden md:block">{triggerLabel}</span>
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            {description ? (
              <DrawerDescription>{description}</DrawerDescription>
            ) : null}
          </DrawerHeader>
          <div className="max-h-[calc(75svh-7rem)] overflow-y-auto px-4 pb-6">
            <GlossaryTerms glossary={glossary} />
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="secondary">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}

function DataTable<TData>({
  columns,
  data,
  columnGroups,
  glossary,
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

  const mobileCardColumnIds = getMobileCardColumnIds(
    resolvedColumnGroups,
    visibleColumnIds,
  );
  const sortableColumns = visibleLeafColumns.filter((column) =>
    column.getCanSort(),
  );
  const sortSelectColumnGroups = getSortSelectColumnGroups(
    resolvedColumnGroups,
    visibleLeafColumns,
  );
  const currentSort = table.getState().sorting[0];
  const currentSortColumn = currentSort
    ? table.getColumn(currentSort.id)
    : null;
  const filteredRowCount = table.getFilteredRowModel().rows.length;
  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = Math.max(table.getPageCount(), 1);
  const currentPage = Math.min(pageIndex + 1, pageCount);
  const pageStart =
    filteredRowCount === 0
      ? 0
      : Math.min(pageIndex * pageSize + 1, filteredRowCount);
  const pageEnd = Math.min((pageIndex + 1) * pageSize, filteredRowCount);
  const paginationLabel = showRowCount
    ? `${pageStart.toLocaleString()}-${pageEnd.toLocaleString()} / ${filteredRowCount.toLocaleString()} • Page ${currentPage.toLocaleString()} / ${pageCount.toLocaleString()}`
    : `Page ${currentPage.toLocaleString()} / ${pageCount.toLocaleString()}`;

  return (
    <div className="space-y-4">
      {showSearchInput || glossary ? (
        <div className="flex items-center gap-2">
          {showSearchInput ? (
            <ClearableInput
              value={globalFilter}
              onValueChange={setGlobalFilter}
              placeholder={searchPlaceholder}
              clearLabel="Clear table search"
              className="w-full rounded-[10px] sm:max-w-sm"
            />
          ) : null}
        </div>
      ) : null}
      <div className="md:hidden">
        {sortableColumns.length > 0 ? (
          <div className="mb-3 flex items-center gap-2">
            <NativeSelect
              value={currentSort?.id ?? ""}
              onChange={(event) => {
                const columnId = event.target.value;

                if (!columnId) {
                  table.setSorting([]);
                  return;
                }

                table.setSorting([{ id: columnId, desc: currentSort?.desc }]);
              }}
              aria-label="Sort rows by"
              className="min-w-0 flex-1"
            >
              <NativeSelectOption value="" disabled>
                Sort by
              </NativeSelectOption>
              {sortSelectColumnGroups.map((group) =>
                group.label ? (
                  <NativeSelectOptGroup key={group.key} label={group.label}>
                    {group.columns.map((column) => (
                      <NativeSelectOption key={column.id} value={column.id}>
                        {getMobileColumnLabel(column)}
                      </NativeSelectOption>
                    ))}
                  </NativeSelectOptGroup>
                ) : (
                  group.columns.map((column) => (
                    <NativeSelectOption key={column.id} value={column.id}>
                      {getMobileColumnLabel(column)}
                    </NativeSelectOption>
                  ))
                ),
              )}
            </NativeSelect>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label={
                currentSort?.desc
                  ? "Sort selected column ascending"
                  : "Sort selected column descending"
              }
              disabled={!currentSortColumn}
              onClick={() => {
                if (!currentSortColumn) {
                  return;
                }

                table.setSorting([
                  { id: currentSortColumn.id, desc: !currentSort?.desc },
                ]);
              }}
            >
              {currentSort?.desc ? <ArrowDownIcon /> : <ArrowUpIcon />}
            </Button>
          </div>
        ) : null}
        {table.getRowModel().rows.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {table.getRowModel().rows.map((row) => {
              const visibleCells = row
                .getVisibleCells()
                .filter((cell) => !cell.column.columnDef.meta?.mobileHidden);
              const titleCell =
                visibleCells.find(
                  (cell) =>
                    cell.column.columnDef.meta?.mobilePriority === "title",
                ) ?? visibleCells[0];
              const contentCells = visibleCells.filter(
                (cell) =>
                  cell.id !== titleCell?.id &&
                  cell.column.columnDef.meta?.mobilePriority !== "title",
              );
              const mobileMetricCells = contentCells.filter((cell) =>
                mobileCardColumnIds.has(cell.column.id),
              );

              return (
                <MobileDataCard
                  key={row.id}
                  titleCell={titleCell}
                  metricCells={mobileMetricCells.slice(0, 6)}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-muted-foreground rounded-xl border py-10 text-center text-sm">
            No stations match this filter.
          </div>
        )}
      </div>
      <div className="hidden md:block">
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
                        "h-9 whitespace-nowrap",
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
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
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
      </div>
      <div className="-mt-1 flex items-center justify-between">
        {glossary ? <DataTableGlossaryView glossary={glossary} /> : null}
        <div className="flex w-full items-center justify-between gap-x-3 md:ml-auto md:w-fit md:justify-end">
          <div className="text-muted-foreground text-[11px] tabular-nums md:text-xs">
            {paginationLabel}
          </div>
          <div className="ml-auto flex items-center gap-x-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Go to first page"
              onClick={() => table.firstPage()}
              disabled={!table.getCanPreviousPage()}
              className="size-7 md:size-8"
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
              className="size-7 md:size-8"
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
              className="size-7 md:size-8"
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
              className="size-7 md:size-8"
            >
              <CaretDoubleRightIcon />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export {
  type DataTableColumnGroup,
  type DataTableGlossary,
  resolveDataTableColumnGroups,
  DataTable,
};
