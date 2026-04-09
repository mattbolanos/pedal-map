import { keepPreviousData, queryOptions } from "@tanstack/react-query";

const STATION_INFORMATION_URL =
	"https://gbfs.citibikenyc.com/gbfs/en/station_information.json";
const STATION_STATUS_URL =
	"https://gbfs.citibikenyc.com/gbfs/en/station_status.json";
const STATION_INFORMATION_QUERY_KEY = [
	"citibike",
	"station-information",
] as const;
const STATION_STATUS_QUERY_KEY = ["citibike", "station-status"] as const;

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

type StationInformationResponse = GbfsResponse<{
	stations: CitiBikeStationInformation[];
}>;

type StationStatusResponse = GbfsResponse<{
	stations: CitiBikeStationStatus[];
}>;

export type CitiBikeStation = CitiBikeStationInformation &
	Partial<Omit<CitiBikeStationStatus, "station_id">>;

export interface CitiBikeStationsData {
	lastUpdated: number;
	stationInformationLastUpdated: number;
	stationStatusLastUpdated: number;
	ttl: number;
	version: string;
	stations: CitiBikeStation[];
}

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

function mergeStations(
	stationInformation: StationInformationResponse,
	stationStatus: StationStatusResponse,
	previousData?: CitiBikeStationsData,
): CitiBikeStationsData {
	const statusesByStationId = new Map(
		stationStatus.data.stations.map((status) => [status.station_id, status]),
	);
	const previousStationsByStationId = new Map(
		previousData?.stations.map((station) => [station.station_id, station]) ??
			[],
	);

	const stations = stationInformation.data.stations.map((station) => {
		const { station_id: _, ...status } =
			statusesByStationId.get(station.station_id) ?? {};
		const nextStation = {
			...station,
			...status,
		};
		const previousStation = previousStationsByStationId.get(station.station_id);

		if (previousStation && areStationsEqual(previousStation, nextStation)) {
			return previousStation;
		}

		return nextStation;
	});

	return {
		lastUpdated: stationStatus.last_updated,
		stationInformationLastUpdated: stationInformation.last_updated,
		stationStatusLastUpdated: stationStatus.last_updated,
		ttl: Math.min(stationInformation.ttl, stationStatus.ttl),
		version: stationStatus.version,
		stations:
			previousData &&
			stations.length === previousData.stations.length &&
			stations.every(
				(station, index) => station === previousData.stations[index],
			)
				? previousData.stations
				: stations,
	};
}

function areStationsEqual(a: CitiBikeStation, b: CitiBikeStation): boolean {
	return (
		a.station_id === b.station_id &&
		a.name === b.name &&
		a.lat === b.lat &&
		a.lon === b.lon &&
		a.capacity === b.capacity &&
		a.electric_bike_surcharge_waiver === b.electric_bike_surcharge_waiver &&
		a.eightd_has_key_dispenser === b.eightd_has_key_dispenser &&
		a.external_id === b.external_id &&
		a.has_kiosk === b.has_kiosk &&
		a.region_id === b.region_id &&
		a.short_name === b.short_name &&
		a.is_charging_station === b.is_charging_station &&
		a.is_installed === b.is_installed &&
		a.is_renting === b.is_renting &&
		a.is_returning === b.is_returning &&
		a.last_reported === b.last_reported &&
		a.num_bikes_available === b.num_bikes_available &&
		a.num_bikes_disabled === b.num_bikes_disabled &&
		a.num_docks_available === b.num_docks_available &&
		a.num_docks_disabled === b.num_docks_disabled &&
		a.num_ebikes_available === b.num_ebikes_available &&
		a.num_scooters_available === b.num_scooters_available &&
		areRentalMethodsEqual(a.rental_methods, b.rental_methods) &&
		areVehicleCountsEqual(
			a.vehicle_docks_available,
			b.vehicle_docks_available,
			(vehicleDockA, vehicleDockB) =>
				vehicleDockA.count === vehicleDockB.count &&
				areStringArraysEqual(
					vehicleDockA.vehicle_type_ids,
					vehicleDockB.vehicle_type_ids,
				),
		) &&
		areVehicleCountsEqual(
			a.vehicle_types_available,
			b.vehicle_types_available,
			(vehicleTypeA, vehicleTypeB) =>
				vehicleTypeA.count === vehicleTypeB.count &&
				vehicleTypeA.vehicle_type_id === vehicleTypeB.vehicle_type_id,
		)
	);
}

function areRentalMethodsEqual(a?: string[], b?: string[]): boolean {
	return areStringArraysEqual(a, b);
}

function areStringArraysEqual(a?: string[], b?: string[]): boolean {
	if (a === b) {
		return true;
	}

	if (!a || !b || a.length !== b.length) {
		return false;
	}

	for (let index = 0; index < a.length; index += 1) {
		if (a[index] !== b[index]) {
			return false;
		}
	}

	return true;
}

function areVehicleCountsEqual<T>(
	a: T[] | undefined,
	b: T[] | undefined,
	compare: (left: T, right: T) => boolean,
): boolean {
	if (a === b) {
		return true;
	}

	if (!a || !b || a.length !== b.length) {
		return false;
	}

	for (let index = 0; index < a.length; index += 1) {
		if (!compare(a[index], b[index])) {
			return false;
		}
	}

	return true;
}

const stationInformationQueryOptions = queryOptions({
	queryKey: STATION_INFORMATION_QUERY_KEY,
	queryFn: ({ signal }) => fetchStationInformation({ signal }),
	staleTime: 60 * 60 * 1000,
	gcTime: 24 * 60 * 60 * 1000,
	refetchOnWindowFocus: false,
});

export const citiBikeStationsQueryOptions = queryOptions({
	queryKey: STATION_STATUS_QUERY_KEY,
	queryFn: async ({ client, signal }) => {
		const [stationInformation, stationStatus] = await Promise.all([
			client.ensureQueryData({
				...stationInformationQueryOptions,
				revalidateIfStale: true,
			}),
			fetchStationStatus({ signal }),
		]);
		const previousData = client.getQueryData<CitiBikeStationsData>(
			STATION_STATUS_QUERY_KEY,
		);

		return mergeStations(stationInformation, stationStatus, previousData);
	},
	staleTime: 10 * 1000,
	gcTime: 24 * 60 * 60 * 1000,
	placeholderData: keepPreviousData,
	refetchInterval: 15 * 1000,
	refetchIntervalInBackground: false,
	refetchOnWindowFocus: false,
});
