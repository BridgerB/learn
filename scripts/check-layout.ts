// Opens build/learn.html on five screen shapes, shows every scene at its end
// state, and fails if anything overlaps or spills off the stage. Screenshots go
// to build/layout/<shape>-<scene>.png so you can look at each one.
//
//   pnpm check:layout            # all scenes
//   pnpm check:layout 3 7        # only scenes 3 and 7 (1-based, as in the player)

import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";

const file = resolve("build/learn.html");
const out = resolve("build/layout");
mkdirSync(out, { recursive: true });
const only = process.argv.slice(2).map(Number);
const shapes = [
	{ name: "large", viewport: { width: 1920, height: 1080 }, touch: false },
	{ name: "desktop", viewport: { width: 1280, height: 800 }, touch: false },
	{ name: "narrow", viewport: { width: 560, height: 900 }, touch: false },
	{ name: "upright", viewport: { width: 390, height: 844 }, touch: true },
	{ name: "sideways", viewport: { width: 844, height: 390 }, touch: true },
];

/** Runs in the page: items in the current scene that overlap or spill. */
function problems() {
	const stage = document.querySelector(".stage")?.getBoundingClientRect();
	if (!stage) return ["no .stage on the page"];
	const sel = [
		".title",
		".body",
		".stack",
		".flow",
		".wrap",
		".band",
		".split",
		".row",
		".cta",
		".demos",
		".compare",
		".file",
	]
		.map((c) => `.cur ${c} > *`)
		.concat(".cur .recap li", ".cur .list li")
		.join(", ");
	const els = [...document.querySelectorAll<HTMLElement>(sel)].filter(
		(e) => e.getBoundingClientRect().width > 0,
	);
	const name = (e: Element) =>
		e.textContent?.trim().replace(/\s+/g, " ").slice(0, 32) ||
		e.tagName.toLowerCase();
	const found: string[] = [];
	for (const e of els) {
		const r = e.getBoundingClientRect();
		if (
			r.left < stage.left - 1 ||
			r.right > stage.right + 1 ||
			r.top < stage.top - 1 ||
			r.bottom > stage.bottom + 1
		)
			found.push(`off the stage: "${name(e)}"`);
		if (
			e.scrollWidth > e.clientWidth + 2 &&
			getComputedStyle(e).overflowX === "visible"
		)
			found.push(`text spills out of: "${name(e)}"`);
	}
	for (let i = 0; i < els.length; i++)
		for (let j = i + 1; j < els.length; j++) {
			if (els[i].contains(els[j]) || els[j].contains(els[i])) continue;
			const a = els[i].getBoundingClientRect();
			const b = els[j].getBoundingClientRect();
			const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
			const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
			if (w > 1 && h > 1)
				found.push(`overlap: "${name(els[i])}" × "${name(els[j])}"`);
		}
	return found;
}

const browser = await chromium.launch();
let total = 0;
for (const shape of shapes) {
	const context = await browser.newContext({
		viewport: shape.viewport,
		hasTouch: shape.touch,
		isMobile: shape.touch,
	});
	const page = await context.newPage();
	const errors: string[] = [];
	page.on("pageerror", (e) => errors.push(e.message));
	await page.goto(`file://${file}`);
	await page.locator(".start").click();
	const play = page.locator('button[title^="Play"]');
	const count = await page.locator(".dots button").count();
	for (let k = 1; k <= count; k++) {
		if (only.length && !only.includes(k)) continue;
		await page.locator(`button[title="Scene ${k}"]`).click();
		if ((await play.textContent()) === "❚❚") await play.click();
		await page
			.getByRole("slider", { name: "Position in this scene" })
			.fill("9999");
		await page.waitForTimeout(1300); // let reveals finish
		const found = await page.evaluate(problems);
		await page.screenshot({ path: `${out}/${shape.name}-${k}.png` });
		if (found.length)
			console.log(`${shape.name}, scene ${k}:\n  ${found.join("\n  ")}`);
		total += found.length;
	}
	if (errors.length) {
		console.log(`${shape.name}: page errors:\n  ${errors.join("\n  ")}`);
		total += errors.length;
	}
	await context.close();
}
await browser.close();
console.log(
	total
		? `${total} problems (screenshots in build/layout)`
		: "layout ok on 5 screen shapes (screenshots in build/layout)",
);
process.exit(total ? 1 : 0);
