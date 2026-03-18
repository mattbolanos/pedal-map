import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import MapView, { type MapRef } from "react-map-gl/maplibre";

export const Route = createFileRoute("/")({ component: StationMap });

function StationMap() {
  const mapRef = useRef<MapRef | null>(null);

  return (
    <div className="relative h-full w-full">
      <MapView
        ref={mapRef}
        initialViewState={{
          longitude: -73.945,
          latitude: 40.719,
          zoom: 12.6,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
      />
    </div>
  );
}
