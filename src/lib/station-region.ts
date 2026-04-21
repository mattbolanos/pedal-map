export type StationRegionBadgeVariant = "jerseyCity" | "nyc" | "hoboken";

const STATION_REGIONS = {
  "70": {
    label: "Jersey City",
    badgeVariant: "jerseyCity",
    pinClassName: "text-violet-300",
  },
  "71": {
    label: "NYC",
    badgeVariant: "nyc",
    pinClassName: "text-sky-300",
  },
  "311": {
    label: "Hoboken",
    badgeVariant: "hoboken",
    pinClassName: "text-pink-300",
  },
} as const satisfies Record<
  string,
  {
    label: string;
    badgeVariant: StationRegionBadgeVariant;
    pinClassName: string;
  }
>;

const STATION_REGION_OVERRIDES: Partial<Record<string, StationRegionId>> = {
  "66dbc860-0aca-11e7-82f6-3863bb44ef7c": "71",
  "1827839088308194240": "71",
  "1903998756008763590": "71",
  "1839334257267825432": "71",
  "1849747691035224144": "311",
  "66db5f40-0aca-11e7-82f6-3863bb44ef7c": "71",
  "1880643497376459348": "71",
  "ea9a19a6-acea-4286-a723-b5481c90a3c0": "71",
  "1844599666569400604": "311",
  "3bfc859b-5c5f-43bc-b2e7-b64ed8ea9ede": "71",
  "2206773064227030872": "71",
  "2206780035495797216": "71",
};

export type StationRegionId = keyof typeof STATION_REGIONS;
export type StationRegion = (typeof STATION_REGIONS)[StationRegionId];
export type StationRegionLabel = StationRegion["label"];

export function isStationRegionId(value: string): value is StationRegionId {
  return Object.hasOwn(STATION_REGIONS, value);
}

export function normalizeStationRegionId(
  regionId: string | undefined,
): StationRegionId | undefined {
  if (!regionId || !isStationRegionId(regionId)) {
    return undefined;
  }

  return regionId;
}

export function getStationRegion(
  regionId: string | null | undefined,
  stationId: string,
) {
  if (!regionId || !isStationRegionId(regionId)) {
    const overriddenRegionId = STATION_REGION_OVERRIDES[stationId];
    if (overriddenRegionId) {
      return STATION_REGIONS[overriddenRegionId];
    }
    return null;
  }

  return STATION_REGIONS[regionId];
}
