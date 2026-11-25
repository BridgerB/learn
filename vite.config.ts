import { defineConfig, type Plugin } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import adapter from "@sveltejs/adapter-static";
import { sveltekit } from "@sveltejs/kit/vite";
import { autoPort } from "@bridgerb/port-from-name";
import type { Connect } from "vite";

/**
 * Serve the app's data at /app-data.zst in dev and preview, built fresh on
 * each request by scripts/data.ts — the same bytes `npm run build:html` embeds.
 */
const appData = (): Plugin => {
	const serve: Connect.NextHandleFunction = async (_req, res) => {
		const { packData } = await import("./scripts/data.ts");
		res.setHeader("content-type", "application/octet-stream");
		res.end(packData());
	};
	return {
		name: "app-data",
		configureServer: (server) =>
			void server.middlewares.use("/app-data.zst", serve),
		configurePreviewServer: (server) =>
			void server.middlewares.use("/app-data.zst", serve),
	};
};

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes("node_modules") ? undefined : true,
			},
			// One self-contained HTML file that opens from disk: everything
			// inlined, and the route kept in the URL hash (`file.html#/about`).
			adapter: adapter({ fallback: "index.html" }),
			output: { bundleStrategy: "inline" },
			router: { type: "hash" },
		}),
		appData(),
		autoPort(),
	],
	// Inline imported assets (images, fonts, SVGs) too, so the file stays single.
	build: { assetsInlineLimit: Infinity },
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: "./vite.config.ts",
				test: {
					name: "client",
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: "chromium", headless: true }],
					},
					include: ["src/**/*.svelte.{test,spec}.{js,ts}"],
					exclude: ["src/lib/server/**"],
				},
			},

			{
				extends: "./vite.config.ts",
				test: {
					name: "server",
					environment: "node",
					include: ["src/**/*.{test,spec}.{js,ts}"],
					exclude: ["src/**/*.svelte.{test,spec}.{js,ts}"],
				},
			},
		],
	},
});
