import { XIcon } from "@phosphor-icons/react/dist/csr/X";
import type { ComponentProps } from "react";
import { cn } from "#/lib/utils";
import { Button } from "./ui/button";

type CloseButtonProps = Omit<
  ComponentProps<typeof Button>,
  "children" | "size" | "variant"
> & {
  iconClassName?: string;
};

export function CloseButton({
  className,
  iconClassName,
  "aria-label": ariaLabel,
  type,
  ...props
}: CloseButtonProps) {
  return (
    <Button
      type={type ?? "button"}
      size="icon-sm"
      variant="secondary"
      aria-label={ariaLabel ?? "Close"}
      className={cn("shrink-0 shadow-sm active:scale-[0.97]", className)}
      {...props}
    >
      <XIcon className={cn("size-4", iconClassName)} />
    </Button>
  );
}
