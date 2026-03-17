import { queryOptions } from "@tanstack/react-query";

const STATION_INFORMATION_URL =
	"https://gbfs.citibikenyc.com/gbfs/en/station_information.json";
const STATION_STATUS_URL =
	"https://gbfs.citibikenyc.com/gbfs/en/station_status.json";

interface GbfsResponse<T> {
	data: T;
	last_updated: number;
	ttl: number;
	version: string;
}

interface CitiBikeStationInformation {
	capacity?: number;
	electric_bike_surcharge_waiver?: boolean;
	eightd_has_key_dispenser?: boolean;
	external_id?: string;
	has_kiosk?: boolean;
	lat: number;
	lon: number;
	name: string;
	region_id?: string;
	rental_methods?: string[];
	short_name?: string;
	station_id: string;
}

interface CitiBikeStationStatus {
	is_charging_station?: boolean;
	is_installed: 0 | 1;
	is_renting: 0 | 1;
	is_returning: 0 | 1;
	last_reported: number;
	num_bikes_available: number;
	num_bikes_disabled?: number;
	num_docks_available: number;
	num_docks_disabled?: number;
	num_ebikes_available?: number;
	num_scooters_available?: number;
	station_id: string;
	vehicle_docks_available?: Array<{
		count: number;
		vehicle_type_ids: string[];
	}>;
	vehicle_types_available?: Array<{
		count: number;
		vehicle_type_id: string;
	}>;
}

export type StationInformationResponse = GbfsResponse<{
	stations: CitiBikeStationInformation[];
}>;

export type StationStatusResponse = GbfsResponse<{
	stations: CitiBikeStationStatus[];
}>;

async function fetchGbfsJson<T>(url: string, signal?: AbortSignal): Promise<T> {
	const response = await fetch(url, { signal });

	if (!response.ok) {
		throw new Error(`Failed to fetch GBFS feed: ${response.status}`);
	}

	return response.json() as Promise<T>;
}

function fetchStationInformation(options?: { signal?: AbortSignal }) {
	return fetchGbfsJson<StationInformationResponse>(
		STATION_INFORMATION_URL,
		options?.signal,
	);
}

function fetchStationStatus(options?: { signal?: AbortSignal }) {
	return fetchGbfsJson<StationStatusResponse>(
		STATION_STATUS_URL,
		options?.signal,
	);
}

export const stationInformationQueryOptions = queryOptions({
	queryKey: ["citibike", "station-information"],
	queryFn: ({ signal }) => fetchStationInformation({ signal }),
	staleTime: 60 * 60 * 1000,
	gcTime: 24 * 60 * 60 * 1000,
	refetchOnWindowFocus: false,
});

export const stationStatusQueryOptions = queryOptions({
	queryKey: ["citibike", "station-status"],
	queryFn: ({ signal }) => fetchStationStatus({ signal }),
	staleTime: 10 * 1000,
	refetchInterval: 15 * 1000,
	refetchIntervalInBackground: false,
	refetchOnWindowFocus: true,
});
