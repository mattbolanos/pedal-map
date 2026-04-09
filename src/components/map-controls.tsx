import type { CitiBikeStation } from "#/lib/citibike";
import { StationSearch } from "./station-search";

interface MapControlsProps {
  stations: CitiBikeStation[];
  onSelectStation: (station: CitiBikeStation) => void;
}

export function MapControls({ stations, onSelectStation }: MapControlsProps) {
  return (
    <div className="absolute top-3 left-3 z-10">
      <StationSearch stations={stations} onSelectStation={onSelectStation} />
    </div>
  );
}
