import { HouseLineIcon } from "@phosphor-icons/react/dist/csr/HouseLine";
import { useHotkey } from "@tanstack/react-hotkeys";
import { cn } from "#/lib/utils";
import { Kbd } from "./ui/kbd";
import { Toggle } from "./ui/toggle";

interface NeighborhoodToggleProps {
  isVisible: boolean;
  onVisibilityChange: (isVisible: boolean) => void;
}

export function NeighborhoodToggle({
  isVisible,
  onVisibilityChange,
}: NeighborhoodToggleProps) {
  const toggleNeighborhoods = () => {
    onVisibilityChange(!isVisible);
  };

  useHotkey("N", toggleNeighborhoods);

  return (
    <Toggle
      variant="outline"
      pressed={isVisible}
      onPressedChange={onVisibilityChange}
      aria-label="Toggle show neighborhoods"
      className="flex items-center gap-x-2"
    >
      <HouseLineIcon
        className={cn(
          isVisible ? "fill-foreground" : "fill-muted-foreground",
          "size-4",
        )}
      />
      Neighborhoods
      <Kbd className="ml-3 hidden md:inline-flex">N</Kbd>
    </Toggle>
  );
}
