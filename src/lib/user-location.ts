import { type GeoCoordinates, isWithinBounds } from "#/lib/geo";

export type UserLocationStatus =
	| "idle"
	| "requesting"
	| "granted"
	| "denied"
	| "error";

export interface UserLocationState {
	coords: GeoCoordinates | null;
	errorMessage?: string;
	isInServiceArea: boolean;
	status: UserLocationStatus;
}

export interface UserLocationToast {
	description?: string;
	title: string;
	variant: "error" | "warning";
}

export const INITIAL_USER_LOCATION_STATE: UserLocationState = {
	coords: null,
	isInServiceArea: false,
	status: "idle",
};

const USER_LOCATION_REQUEST_OPTIONS: PositionOptions = {
	enableHighAccuracy: true,
	maximumAge: 120_000,
	timeout: 10_000,
};

export function hasActiveUserLocation(userLocation: UserLocationState) {
	return (
		userLocation.status === "granted" &&
		userLocation.coords !== null &&
		userLocation.isInServiceArea
	);
}

export function isUserLocationOutOfServiceArea(
	userLocation: UserLocationState,
) {
	return userLocation.status === "granted" && !userLocation.isInServiceArea;
}

export function hasUserLocationIssue(userLocation: UserLocationState) {
	return (
		userLocation.status === "denied" ||
		userLocation.status === "error" ||
		isUserLocationOutOfServiceArea(userLocation)
	);
}

export function getUserLocationErrorMessage(error: GeolocationPositionError) {
	switch (error.code) {
		case error.PERMISSION_DENIED:
			return "Location access was denied.";
		case error.POSITION_UNAVAILABLE:
			return "Your location is unavailable right now.";
		case error.TIMEOUT:
			return "Location lookup timed out.";
		default:
			return "Unable to get your location.";
	}
}

function getUserLocationStateFromPosition(
	position: GeolocationPosition,
): UserLocationState {
	const coords = {
		accuracy: position.coords.accuracy,
		lat: position.coords.latitude,
		lon: position.coords.longitude,
	};
	const isInServiceArea = isWithinBounds(coords);

	return {
		coords,
		errorMessage: isInServiceArea
			? undefined
			: "You are outside the Citi Bike service area.",
		isInServiceArea,
		status: "granted",
	};
}

export function requestCurrentUserLocation(
	geolocation: Geolocation | undefined,
) {
	if (!geolocation) {
		return Promise.resolve<UserLocationState>({
			coords: null,
			errorMessage: "Geolocation is not supported in this browser.",
			isInServiceArea: false,
			status: "error",
		});
	}

	return new Promise<UserLocationState>((resolve) => {
		geolocation.getCurrentPosition(
			(position) => {
				resolve(getUserLocationStateFromPosition(position));
			},
			(error) => {
				resolve({
					coords: null,
					errorMessage: getUserLocationErrorMessage(error),
					isInServiceArea: false,
					status: error.code === error.PERMISSION_DENIED ? "denied" : "error",
				});
			},
			USER_LOCATION_REQUEST_OPTIONS,
		);
	});
}

export function getUserLocationToast(userLocation: UserLocationState) {
	if (userLocation.status === "denied") {
		return {
			description:
				userLocation.errorMessage ??
				"Enable location access to find the closest Citi Bike stations.",
			title: "Location access denied",
			variant: "error",
		} satisfies UserLocationToast;
	}

	if (userLocation.status === "error") {
		return {
			description: userLocation.errorMessage,
			title: "Couldn't get your location",
			variant: "error",
		} satisfies UserLocationToast;
	}

	if (isUserLocationOutOfServiceArea(userLocation)) {
		return {
			description:
				userLocation.errorMessage ??
				"Nearby only works inside the Citi Bike service area.",
			title: "Outside the Citi Bike service area",
			variant: "warning",
		} satisfies UserLocationToast;
	}

	return null;
}
