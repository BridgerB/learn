// Builds the whole app and its data into one HTML file: build/<package name>.html.
// It opens straight from disk, with no server.
//
//   npm run build:html

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { packData } from "./data.ts";

const { name } = JSON.parse(readFileSync("package.json", "utf-8")) as {
	name: string;
};
const out = `build/${name}.html`;

const data = packData();

const build = spawnSync("pnpm", ["exec", "vite", "build"], {
	stdio: "inherit",
});
if (build.status !== 0) process.exit(build.status ?? 1);

// The app reads its data from this element (src/lib/data/load.ts). It goes first
// in <body>, so it's in the DOM before the app's inlined script asks for it.
const html = readFileSync("build/index.html", "utf-8");
const tag = `<script id="app-data" type="application/octet-stream">${data.toString("base64")}</script>`;
const body = html.match(/<body[^>]*>/)?.[0];
if (!body) throw new Error("build/index.html has no <body> to put the data in");
const page = html.replace(body, `${body}\n${tag}`);

// Format the finished page with Biome (biome.json: html.formatter), so the file
// is readable and is already what the repo that ships it formats it to.
// - It's fed through stdin under a root-level name: a path inside build/ is
//   excluded in biome.json, and Biome passes excluded files through unformatted.
// - One pass over minified code isn't Biome's final answer (long member chains
//   get laid out again on a second pass), so format until the output stops changing.
function biomeFormat(source: string) {
	const r = spawnSync(
		"pnpm",
		["exec", "biome", "format", `--stdin-file-path=${name}.html`],
		{ input: source, encoding: "utf-8", maxBuffer: 64 * 1024 * 1024 },
	);
	if (r.status !== 0 || !r.stdout || /not formatted/.test(r.stderr)) {
		throw new Error(`biome couldn't format the page:\n${r.stderr}`);
	}
	return r.stdout;
}
let formatted = page;
let passes = 0;
for (
	let next = biomeFormat(formatted);
	next !== formatted;
	next = biomeFormat(formatted)
) {
	if (++passes > 4)
		throw new Error("biome output never settled after 4 passes");
	formatted = next;
}
writeFileSync(out, formatted);

const kb = (n: number) => `${(n / 1000).toFixed(1)} KB`;
console.log(
	`\nwrote ${out}: ${kb(Buffer.byteLength(formatted))}, Biome-formatted in ${passes} pass${passes === 1 ? "" : "es"} (app ${kb(Buffer.byteLength(html))}, data ${kb(tag.length)} before formatting)`,
);
