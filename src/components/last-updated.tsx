import NumberFlow from "@number-flow/react";
import { useEffect, useState } from "react";

import {
	cn,
	getRelativeTime,
	getRelativeTimeRefreshDelay,
	getRelativeTimeValue,
	isValidEpochSeconds,
} from "#/lib/utils";

interface LastUpdatedProps {
	lastReported: number | undefined;
	className?: string;
}

export function LastUpdated({ lastReported, className }: LastUpdatedProps) {
	const [now, setNow] = useState(() => Date.now());
	const relativeTime = getRelativeTime(lastReported, now);
	const relativeTimeValue = getRelativeTimeValue(lastReported, now);
	const relativeTimeSuffix = relativeTimeValue
		? ` ${relativeTimeValue.unit}${relativeTimeValue.value === 1 ? "" : "s"} ago`
		: null;
	const dateTime = isValidEpochSeconds(lastReported)
		? new Date(lastReported * 1000).toISOString()
		: undefined;

	useEffect(() => {
		if (!isValidEpochSeconds(lastReported)) return;

		const timeoutMs = getRelativeTimeRefreshDelay(lastReported, now);
		if (timeoutMs === null) return;

		const timeoutId = window.setTimeout(() => {
			setNow(Date.now());
		}, timeoutMs);

		return () => {
			window.clearTimeout(timeoutId);
		};
	}, [lastReported, now]);

	if (!relativeTime) return null;

	return (
		<time
			suppressHydrationWarning
			dateTime={dateTime}
			className={cn("text-[11px] tabular-nums", className)}
		>
			{relativeTimeValue ? (
				<>
					<span aria-hidden="true">
						<NumberFlow
							value={relativeTimeValue.value}
							prefix="Updated "
							suffix={relativeTimeSuffix ?? ""}
							locales="en-US"
							trend={0}
						/>
					</span>
					<span className="sr-only">Updated {relativeTime}</span>
				</>
			) : (
				`Updated ${relativeTime}`
			)}
		</time>
	);
}
