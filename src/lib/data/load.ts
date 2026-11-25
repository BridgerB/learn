import { decompress } from "fzstd";
import type { AppData } from "./types";

let loading: Promise<AppData> | null = null;

/**
 * The app's data, loaded once. The single-file build embeds it as base64 in
 * `<script id="app-data">`; in dev and preview it's served at `/app-data.zst`
 * (vite.config.ts). Either way it's zstd-compressed JSON.
 */
export function loadData() {
	loading ??= (async () => {
		const embedded = document.getElementById("app-data");
		const res = embedded
			? await fetch(
					`data:application/octet-stream;base64,${embedded.textContent?.trim()}`,
				)
			: await fetch("/app-data.zst");
		if (!res.ok)
			throw new Error(`Couldn't load the app's data (${res.status})`);
		const bytes = decompress(new Uint8Array(await res.arrayBuffer()));
		return JSON.parse(new TextDecoder().decode(bytes)) as AppData;
	})();
	loading.catch(() => (loading = null));
	return loading;
}
