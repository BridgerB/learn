import { portFromName } from "@bridgerb/port-from-name";
import { defineConfig } from "@playwright/test";

// vite.config.ts uses autoPort(), so preview runs on this project's own port.
const port = portFromName();

export default defineConfig({
	webServer: { command: "pnpm build && pnpm preview", port },
	use: { baseURL: `http://localhost:${port}` },
	testMatch: "**/*.e2e.{ts,js}",
});
