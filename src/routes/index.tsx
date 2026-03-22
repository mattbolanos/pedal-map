import { createFileRoute } from "@tanstack/react-router";
import MapView from "react-map-gl/maplibre";

export const Route = createFileRoute("/")({ component: StationMap });

const MAP_STYLE_URL = `https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${import.meta.env.VITE_MAPTILER_KEY}`;

function StationMap() {
  return (
    <div className="relative size-full">
      <div className="size-full">
        <MapView
          initialViewState={{
            longitude: -73.945,
            latitude: 40.719,
            zoom: 12.6,
          }}
          mapStyle={MAP_STYLE_URL}
        />
      </div>
    </div>
  );
}
