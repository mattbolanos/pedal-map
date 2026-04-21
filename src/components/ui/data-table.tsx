import { CaretDownIcon } from "@phosphor-icons/react/dist/csr/CaretDown";
import { CaretUpIcon } from "@phosphor-icons/react/dist/csr/CaretUp";
import { CaretUpDownIcon } from "@phosphor-icons/react/dist/csr/CaretUpDown";
import type {
  Column,
  ColumnDef,
  InitialTableState,
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

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
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

function SortButton<TData>({ column, children }: SortButtonProps<TData>) {
  const sortDirection = column.getIsSorted();

  return (
    <button
      type="button"
      className="flex items-center gap-2"
      onClick={() => column.toggleSorting(sortDirection === "asc")}>
      {children}
      <span
        className={cn(
          "text-muted-foreground",
          sortDirection === "asc"
            ? "text-green-500"
            : sortDirection === "desc"
              ? "text-red-500"
              : "text-gray-500",
        )}>
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

export function DataTable<TData>({
  columns,
  data,
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

  return (
    <div className="flex flex-col gap-4">
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

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-accent">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="h-10">
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
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-muted-foreground h-24 text-center">
                No stations match this filter.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}>
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}>
          Next
        </Button>
      </div>
    </div>
  );
}
