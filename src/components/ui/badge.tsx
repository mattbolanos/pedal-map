import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const neighborhoodBadgeVariants = {
  nyc: "border-sky-500/25 bg-sky-500/12 text-sky-700 dark:text-sky-300",
  jerseyCity:
    "border-emerald-500/25 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  hoboken:
    "border-amber-500/25 bg-amber-500/12 text-amber-700 dark:text-amber-300",
  chelsea: "border-rose-500/25 bg-rose-500/12 text-rose-700 dark:text-rose-300",
  westVillage:
    "border-orange-500/25 bg-orange-500/12 text-orange-700 dark:text-orange-300",
  eastVillage:
    "border-fuchsia-500/25 bg-fuchsia-500/12 text-fuchsia-700 dark:text-fuchsia-300",
  lowerManhattan:
    "border-slate-500/25 bg-slate-500/12 text-slate-700 dark:text-slate-300",
  harlem:
    "border-violet-500/25 bg-violet-500/12 text-violet-700 dark:text-violet-300",
  upperWestSide:
    "border-blue-500/25 bg-blue-500/12 text-blue-700 dark:text-blue-300",
  upperEastSide:
    "border-cyan-500/25 bg-cyan-500/12 text-cyan-700 dark:text-cyan-300",
  midtownEast:
    "border-indigo-500/25 bg-indigo-500/12 text-indigo-700 dark:text-indigo-300",
  dumbo:
    "border-stone-500/25 bg-stone-500/12 text-stone-700 dark:text-stone-300",
  downtownBrooklyn:
    "border-red-500/25 bg-red-500/12 text-red-700 dark:text-red-300",
  parkSlope:
    "border-lime-500/25 bg-lime-500/12 text-lime-700 dark:text-lime-300",
  prospectHeights:
    "border-green-500/25 bg-green-500/12 text-green-700 dark:text-green-300",
  crownHeights:
    "border-pink-500/25 bg-pink-500/12 text-pink-700 dark:text-pink-300",
  bedStuyBushwick:
    "border-purple-500/25 bg-purple-500/12 text-purple-700 dark:text-purple-300",
  williamsburg:
    "border-teal-500/25 bg-teal-500/12 text-teal-700 dark:text-teal-300",
  greenpoint:
    "border-emerald-500/25 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  longIslandCity:
    "border-emerald-600/25 bg-emerald-600/12 text-emerald-700 dark:text-emerald-300",
  astoria:
    "border-yellow-500/25 bg-yellow-500/12 text-yellow-700 dark:text-yellow-300",
} as const;

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pe-1.5 has-data-[icon=inline-start]:ps-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline:
          "border-border bg-input/30 text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
        offline: "bg-mist-800 text-mist-300 border-mist-700",
        ...neighborhoodBadgeVariants,
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props,
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  });
}

export { Badge, badgeVariants };
