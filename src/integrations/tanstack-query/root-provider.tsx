import { QueryClient } from "@tanstack/react-query";

export interface AppRouterContext {
	queryClient: QueryClient;
}

let browserContext: AppRouterContext | undefined;

function createAppRouterContext(): AppRouterContext {
	return {
		queryClient: new QueryClient(),
	};
}

export function getRouterContext(): AppRouterContext {
	if (typeof window === "undefined") {
		return createAppRouterContext();
	}

	if (!browserContext) {
		browserContext = createAppRouterContext();
	}

	return browserContext;
}
