import { createFileRoute } from "@tanstack/react-router";
import MapView, { type StyleSpecification } from "react-map-gl/maplibre";
import ThemeToggle from "#/components/theme-toggle";

export const Route = createFileRoute("/")({ component: StationMap });

function StationMap() {
  return (
    <div className="relative h-full w-full">
      <div className="fixed top-4 left-4 z-10">
        <ThemeToggle />
      </div>

      <div className="pedal-map h-full w-full">
        <MapView
          initialViewState={{
            longitude: -73.945,
            latitude: 40.719,
            zoom: 12.6,
          }}
          mapStyle={MAP_STYLE}
        />
      </div>
    </div>
  );
}

const MAP_STYLE: StyleSpecification = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "bg",
      type: "background",
      paint: {
        "background-color": "#efe7db",
      },
    },
    {
      id: "osm",
      type: "raster",
      source: "osm",
      paint: {
        "raster-saturation": -0.4,
        "raster-contrast": 0.08,
        "raster-brightness-min": 0.2,
        "raster-brightness-max": 0.95,
      },
    },
  ],
};
