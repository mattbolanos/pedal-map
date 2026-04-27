import { describe, expect, it } from "vitest";
import {
  resolveDataTableColumnGroups,
  type DataTableColumnGroup,
} from "./data-table";

describe("resolveDataTableColumnGroups", () => {
  it("groups contiguous columns and preserves ungrouped columns", () => {
    const columnGroups: DataTableColumnGroup[] = [
      {
        label: "Available Now",
        columnIds: ["bikesNow", "docksNow"],
      },
    ];

    expect(
      resolveDataTableColumnGroups(
        ["station", "bikesNow", "docksNow"],
        columnGroups,
      ),
    ).toEqual([
      {
        key: "ungrouped:station",
        colSpan: 1,
        label: "",
      },
      {
        key: "group:bikesNow:docksNow",
        colSpan: 2,
        label: "Available Now",
      },
    ]);
  });

  it("falls back to ungrouped cells when a declared group is not contiguous", () => {
    const columnGroups: DataTableColumnGroup[] = [
      {
        label: "Available Now",
        columnIds: ["bikesNow", "docksNow"],
      },
    ];

    expect(
      resolveDataTableColumnGroups(
        ["station", "bikesNow", "capacity", "docksNow"],
        columnGroups,
      ),
    ).toEqual([
      {
        key: "ungrouped:station",
        colSpan: 1,
        label: "",
      },
      {
        key: "ungrouped:bikesNow",
        colSpan: 1,
        label: "",
      },
      {
        key: "ungrouped:capacity",
        colSpan: 1,
        label: "",
      },
      {
        key: "ungrouped:docksNow",
        colSpan: 1,
        label: "",
      },
    ]);
  });
});
