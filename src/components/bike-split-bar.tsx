import { GearSixIcon } from "@phosphor-icons/react/dist/csr/GearSix";
import { LightningIcon } from "@phosphor-icons/react/dist/csr/Lightning";
import { cn } from "#/lib/utils";
import { Progress } from "./ui/progress";

export function BikeSplitBar({
  electric,
  classic,
  total,
  className,
}: {
  electric: number;
  classic: number;
  total: number;
  className?: string;
}) {
  if (total === 0) return null;

  const electricPct = Math.round((electric / total) * 100);

  return (
    <div className={cn("space-y-1.5 py-0.5", className)}>
      <Progress
        value={electricPct}
        className="gap-0"
        trackClassName="h-1.5 bg-sky-400/80 dark:bg-sky-300/80"
        indicatorClassName="bg-amber-400 dark:bg-amber-300"
      />
      {/* legend row */}
      <div className="flex items-center gap-3 tabular-nums">
        {electric > 0 && (
          <span className="flex items-center gap-x-1.5">
            <LightningIcon
              weight="fill"
              className="size-4 text-amber-400 dark:text-amber-300"
            />
            <span className="text-muted-foreground">Electric</span>
            <span>{electric.toLocaleString()}</span>
          </span>
        )}
        {classic > 0 && (
          <span
            className={cn(
              "flex items-center gap-x-1.5",
              electric > 0 && "ml-auto flex-row-reverse",
            )}
          >
            <GearSixIcon className="size-4 text-sky-400 dark:text-sky-300" />
            <span className="text-muted-foreground">Classic</span>
            <span>{classic.toLocaleString()}</span>
          </span>
        )}
      </div>
    </div>
  );
}
