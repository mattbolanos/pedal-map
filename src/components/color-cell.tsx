import { availabilityColorCss } from "#/lib/station-pin";

interface ColorCellProps {
  active: boolean;
  formatOptions?: Intl.NumberFormatOptions;
  ratio: number | null;
  value: number | null;
}

export function ColorCell({
  active,
  formatOptions = {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  },
  ratio,
  value,
}: ColorCellProps) {
  if (value === null) {
    return <span className="text-muted-foreground tabular-nums">--</span>;
  }

  const color = ratio === null ? null : availabilityColorCss(ratio, active);

  return (
    <span
      className="inline-flex items-center gap-1.5 tabular-nums"
      style={color ? { color } : undefined}
    >
      <span>{value.toLocaleString(undefined, formatOptions)}</span>
    </span>
  );
}
