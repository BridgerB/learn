import { loadData } from "#lib/data/load.js";
import type { LayoutLoad } from "./$types";

// Hash routing makes the app client-only, so this always runs in the browser.
// Pages get the data from `await parent()` or `page.data`.
export const load: LayoutLoad = async () => ({ data: await loadData() });
