import * as React from "react";

const TOUCH_DEVICE_QUERY = "(hover: none) and (pointer: coarse)";

export function useIsTouchDevice() {
	const [isTouchDevice, setIsTouchDevice] = React.useState(false);

	React.useEffect(() => {
		const mediaQuery = window.matchMedia(TOUCH_DEVICE_QUERY);
		const updateIsTouchDevice = () => {
			setIsTouchDevice(mediaQuery.matches);
		};

		updateIsTouchDevice();
		mediaQuery.addEventListener("change", updateIsTouchDevice);

		return () => mediaQuery.removeEventListener("change", updateIsTouchDevice);
	}, []);

	return isTouchDevice;
}
