import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function getRelativeTime(
	epochSeconds: number | undefined,
): string | null {
	if (!epochSeconds) return null;
	const diffMs = Date.now() - epochSeconds * 1000;
	const diffMin = Math.floor(diffMs / 60000);
	if (diffMin < 1) return "Just now";
	if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
	const diffHr = Math.floor(diffMin / 60);
	if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
	const diffDays = Math.floor(diffHr / 24);
	if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
	const diffMonths = Math.floor(diffDays / 30);
	if (diffMonths < 12)
		return `${diffMonths} month${diffMonths === 1 ? "" : "s"} ago`;
	return `over a year ago`;
}
