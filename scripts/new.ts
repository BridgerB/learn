// Starts a new page in this clone: removes learn's own narration and scenes, and
// writes a starter data/script.json.
//
//   pnpm new "how DNS works"

import { existsSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const title = process.argv.slice(2).join(" ").trim();
if (!title) {
	console.error('usage: pnpm new "<title>"');
	process.exit(1);
}

const data = join(root, "data");
const scenes = join(root, "src/lib/explainer/scenes");
const removed: string[] = [];
for (const name of readdirSync(data)) {
	if (
		/^line\d+\.wav$/.test(name) ||
		["durs.json", "script.json", "SKILL.md"].includes(name)
	) {
		rmSync(join(data, name));
		removed.push(`data/${name}`);
	}
}
if (existsSync(scenes))
	for (const name of readdirSync(scenes)) {
		if (/^S\d+.*\.svelte$/.test(name)) {
			rmSync(join(scenes, name));
			removed.push(`scenes/${name}`);
		}
	}

const script = {
	title,
	voice: "af_heart",
	speed: 1.15,
	lang: "en-us",
	lines: [] as string[],
};
writeFileSync(
	join(data, "script.json"),
	`${JSON.stringify(script, null, "\t")}\n`,
);
console.log(
	`removed ${removed.length} files; wrote data/script.json for "${title}"`,
);
