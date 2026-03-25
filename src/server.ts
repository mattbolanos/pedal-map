import type { Register } from "@tanstack/react-router";
import {
	createStartHandler,
	defaultStreamHandler,
	type RequestHandler,
} from "@tanstack/react-start/server";
import { FastResponse } from "srvx";

Object.defineProperty(globalThis, "Response", {
	value: FastResponse,
	configurable: true,
	writable: true,
});

const fetch = createStartHandler(defaultStreamHandler);

type ServerEntry = { fetch: RequestHandler<Register> };

export function createServerEntry(entry: ServerEntry): ServerEntry {
	return {
		async fetch(...args) {
			return await entry.fetch(...args);
		},
	};
}

export default createServerEntry({ fetch });
