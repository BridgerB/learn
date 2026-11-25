import { expect, test } from "@playwright/test";

// Runs against `vite preview`, which serves the built app and its data.
test("opens on the start screen with real, selectable text", async ({
	page,
}) => {
	await page.goto("/");
	await expect(page.getByRole("button", { name: /learn/ })).toBeVisible();
	await expect(page.locator("h1")).toHaveText("learn");
	await expect(page.getByText("9 scenes")).toBeVisible();
});

test("starting plays scene 1, and Next moves through the scenes", async ({
	page,
}) => {
	await page.goto("/");
	await page.getByRole("button", { name: /learn/ }).click();
	await expect(page.locator(".count")).toHaveText("1 / 9");
	await expect(page.locator(".cap")).toContainText("a Claude Code skill");
	await page.getByRole("button", { name: "Next →" }).click();
	await expect(page.locator(".count")).toHaveText("2 / 9");
	await expect(page.locator("section.cur h2")).toHaveText("Install it");
	await page.keyboard.press("ArrowLeft");
	await expect(page.locator(".count")).toHaveText("1 / 9");
});

test("unknown routes go home", async ({ page }) => {
	await page.goto("/#/nowhere");
	await expect(page).toHaveURL(/#\/$/);
});

test("clicking a caption word jumps to it, and the timeline seeks", async ({
	page,
}) => {
	await page.goto("/");
	await page.getByRole("button", { name: /learn/ }).click();
	await page.locator(".word", { hasText: /^time\.$/ }).click();
	await expect(page.locator(".word.now")).toHaveText("time.");
	await expect(page.locator(".cap")).toContainText("one scene at a time.");

	// Pause first, so the position holds still while it's checked.
	await page.getByRole("button", { name: "❚❚" }).click();
	const timeline = page.getByRole("slider", { name: "Position in this scene" });
	await timeline.fill("0.5");
	await expect(page.locator(".word.now")).toHaveText("Welcome");
	await expect(page.locator(".word.said")).toHaveCount(0);
	await timeline.fill("12.4"); // the line ends at 12.5 s
	await expect(page.locator(".word.now")).toHaveText("time.");
	await expect(page.locator("section.cur .on").first()).toBeVisible();
});

test("speed and volume reach the voice, and are remembered", async ({
	page,
}) => {
	// Collect the narration <audio> elements as they start playing.
	await page.addInitScript(() => {
		const w = window as unknown as { voices: HTMLMediaElement[] };
		w.voices = [];
		const play = HTMLMediaElement.prototype.play;
		HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
			w.voices.push(this);
			return play.call(this);
		};
	});
	const voice = () =>
		page.evaluate(() => {
			const a = (window as unknown as { voices: HTMLMediaElement[] }).voices.at(
				-1,
			);
			return a && { rate: a.playbackRate, volume: a.volume, muted: a.muted };
		});

	await page.goto("/");
	await page.getByRole("button", { name: /learn/ }).click();
	await page.getByRole("combobox", { name: "Speed" }).selectOption("1.5");
	await page.getByRole("slider", { name: "Volume" }).fill("0.4");
	await expect.poll(voice).toEqual({ rate: 1.5, volume: 0.4, muted: false });

	await page.keyboard.press("m");
	await expect.poll(voice).toMatchObject({ muted: true });
	await page.keyboard.press("m");

	await page.reload();
	await expect(page.getByRole("combobox", { name: "Speed" })).toHaveValue(
		"1.5",
	);
	await expect(page.getByRole("slider", { name: "Volume" })).toHaveValue("0.4");
});

test("clicking the picture pauses and plays; dragging across it doesn't", async ({
	page,
}) => {
	await page.goto("/");
	await page.getByRole("button", { name: /learn/ }).click();
	const play = page.locator('button[title^="Play"]');
	await expect(play).toHaveText("❚❚");

	const box = await page.locator(".view").boundingBox();
	if (!box) throw new Error("the picture (.view) has no box");
	const cx = box.x + box.width / 2;
	const cy = box.y + box.height / 2;
	await page.mouse.click(cx, cy);
	await expect(play).toHaveText("▶");
	await page.mouse.click(cx, cy);
	await expect(play).toHaveText("❚❚");

	// A drag (e.g. selecting text) leaves playback alone.
	await page.mouse.move(box.x + 40, cy);
	await page.mouse.down();
	await page.mouse.move(box.x + box.width - 40, cy, { steps: 8 });
	await page.mouse.up();
	await expect(play).toHaveText("❚❚");
});

test("the last scene links to the repo, and clicking it doesn't toggle playback", async ({
	page,
}) => {
	await page.goto("/");
	await page.getByRole("button", { name: /learn/ }).click();
	await page.locator('button[title="Scene 9"]').click();
	await page.locator('button[title^="Play"]').click(); // pause, so only the link click could change it
	await page.getByRole("slider", { name: "Position in this scene" }).fill("30");
	const link = page.getByRole("link", { name: "★ Star on GitHub" });
	await expect(link).toBeVisible();
	await expect(link).toHaveAttribute(
		"href",
		"https://github.com/BridgerB/learn",
	);
	await expect(link).toHaveAttribute("target", "_blank");

	const play = page.locator('button[title^="Play"]');
	await expect(play).toHaveText("▶");
	const [tab] = await Promise.all([page.waitForEvent("popup"), link.click()]);
	await tab.close();
	await expect(play).toHaveText("▶"); // still paused
});

test("after the last scene, play starts over from scene 1", async ({
	page,
}) => {
	await page.goto("/");
	await page.getByRole("button", { name: /learn/ }).click();
	await page.locator('button[title="Scene 9"]').click();
	// Jump to the end of the last scene and let it finish.
	await page.getByRole("slider", { name: "Position in this scene" }).fill("30");
	const play = page.locator('button[title^="Play"]');
	await expect(play).toHaveText("↻");
	await expect(play).toHaveAttribute("title", /from the start/);

	// Clicking the picture now replays from the top, not just the last scene.
	const box = await page.locator(".view").boundingBox();
	if (!box) throw new Error("the picture (.view) has no box");
	await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
	await expect(page.locator(".count")).toHaveText("1 / 9");
	await expect(play).toHaveText("❚❚");
});

test("with Auto off, play after a scene finishes moves on to the next", async ({
	page,
}) => {
	await page.goto("/");
	await page.getByRole("button", { name: /learn/ }).click();
	await page.getByRole("button", { name: "Auto" }).click(); // off
	await page.getByRole("slider", { name: "Position in this scene" }).fill("30");
	const play = page.locator('button[title^="Play"]');
	await expect(play).toHaveText("▶"); // finished, waiting
	await page.keyboard.press("Space");
	await expect(page.locator(".count")).toHaveText("2 / 9");
	await expect(play).toHaveText("❚❚");
});

test("shortcuts hide behind the ? button", async ({ page }) => {
	await page.goto("/");
	await page.getByRole("button", { name: /learn/ }).click();
	const panel = page.locator("#shortcuts");
	await expect(panel).toBeHidden();
	await page.getByRole("button", { name: "?" }).click();
	await expect(panel).toBeVisible();
	await expect(panel).toContainText("replay the scene");
	await page.keyboard.press("Escape");
	await expect(panel).toBeHidden();
	await expect(page.locator('button[title^="Play"]')).toHaveText("❚❚"); // still playing
});

test("the last scene downloads SKILL.md, and the copied command installs it", async ({
	page,
	context,
}) => {
	const { readFileSync, mkdtempSync, rmSync } = await import("node:fs");
	const { tmpdir } = await import("node:os");
	const { join } = await import("node:path");
	const { spawnSync } = await import("node:child_process");
	const skill = readFileSync("data/SKILL.md", "utf8");

	await context.grantPermissions(["clipboard-read", "clipboard-write"]);
	await page.goto("/");
	await page.getByRole("button", { name: /learn/ }).click();
	await page.locator('button[title="Scene 9"]').click();
	await page.getByRole("slider", { name: "Position in this scene" }).fill("30");

	// Download: a file named SKILL.md with exactly the skill's text.
	const [download] = await Promise.all([
		page.waitForEvent("download"),
		page.getByRole("button", { name: /Download SKILL\.md/ }).click(),
	]);
	expect(download.suggestedFilename()).toBe("SKILL.md");
	const saved = await download.path();
	expect(readFileSync(saved, "utf8")).toBe(skill);

	// Copy: the command, run in a throwaway home folder, installs the same file.
	await page.getByRole("button", { name: "Copy install command" }).click();
	await expect(page.getByRole("button", { name: "Copied ✓" })).toBeVisible();
	const command = await page.evaluate(() => navigator.clipboard.readText());
	const home = mkdtempSync(join(tmpdir(), "learn-home-"));
	try {
		const run = spawnSync("bash", ["-c", command], {
			env: { ...process.env, HOME: home },
		});
		expect(run.status).toBe(0);
		expect(
			readFileSync(join(home, ".claude/skills/learn/SKILL.md"), "utf8"),
		).toBe(skill);
	} finally {
		rmSync(home, { recursive: true, force: true });
	}
});

/** Items in the current scene that overlap each other or spill off the stage. */
function layoutProblems() {
	const stage = document.querySelector(".stage")?.getBoundingClientRect();
	if (!stage) return ["no stage"];
	const sel = [
		".title",
		".body",
		".stack",
		".flow",
		".wrap",
		".phones",
		".cta",
		".row",
		".file",
	]
		.map((c) => `.cur ${c} > *`)
		.concat(".cur .recap li", ".cur .list li")
		.join(", ");
	const els = [...document.querySelectorAll<HTMLElement>(sel)].filter(
		(e) => e.getBoundingClientRect().width > 0,
	);
	const name = (e: Element) =>
		e.textContent?.trim().replace(/\s+/g, " ").slice(0, 28) ||
		e.className.toString();
	const out: string[] = [];
	for (const e of els) {
		const r = e.getBoundingClientRect();
		if (
			r.left < stage.left - 1 ||
			r.right > stage.right + 1 ||
			r.top < stage.top - 1 ||
			r.bottom > stage.bottom + 1
		)
			out.push(`off stage: ${name(e)}`);
	}
	for (let i = 0; i < els.length; i++)
		for (let j = i + 1; j < els.length; j++) {
			if (els[i].contains(els[j]) || els[j].contains(els[i])) continue;
			const a = els[i].getBoundingClientRect();
			const b = els[j].getBoundingClientRect();
			const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
			const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
			if (w > 1 && h > 1)
				out.push(`overlap: ${name(els[i])} × ${name(els[j])}`);
		}
	return out;
}

for (const [name, viewport] of [
	["a desktop window", { width: 1280, height: 800 }],
	["a narrow window", { width: 560, height: 900 }],
	["a phone held upright", { width: 390, height: 844 }],
	["a phone held sideways", { width: 844, height: 390 }],
] as const) {
	test.describe(`in ${name}`, () => {
		test.use({ viewport });
		test("every scene fits the stage with nothing overlapping", async ({
			page,
			context,
		}) => {
			await context.grantPermissions(["clipboard-read", "clipboard-write"]);
			await page.goto("/");
			await page.locator(".start").click();
			const play = page.locator('button[title^="Play"]');
			const scenes = await page.locator(".dots button").count();
			for (let k = 1; k <= scenes; k++) {
				await page.locator(`button[title="Scene ${k}"]`).click();
				if ((await play.textContent()) === "❚❚") await play.click();
				await page
					.getByRole("slider", { name: "Position in this scene" })
					.fill("99");
				await page.waitForTimeout(1300); // reveals finish
				expect(await page.evaluate(layoutProblems), `scene ${k}`).toEqual([]);
			}
			// The copy button's label changes when clicked: check that state too.
			await page.getByRole("button", { name: "Copy install command" }).click();
			expect(
				await page.evaluate(layoutProblems),
				"last scene after Copy",
			).toEqual([]);
		});
	});
}

test("resizing the window mid-scene rearranges it, and playback carries on", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto("/");
	await page.locator(".start").click();
	await page.locator('button[title="Scene 4"]').click(); // "One HTML file": file | claims
	const columns = () =>
		page
			.locator("section.cur .split")
			.evaluate(
				(e) => getComputedStyle(e).gridTemplateColumns.split(" ").length,
			);
	await expect.poll(columns).toBe(2);

	await page.setViewportSize({ width: 500, height: 900 });
	await expect.poll(columns).toBe(1);
	await expect(page.locator('button[title^="Play"]')).toHaveText("❚❚"); // still playing
	expect(await page.evaluate(layoutProblems)).toEqual([]);

	await page.setViewportSize({ width: 1280, height: 800 });
	await expect.poll(columns).toBe(2);
});

for (const [name, viewport] of [
	["upright", { width: 390, height: 844 }],
	["sideways", { width: 844, height: 390 }],
] as const) {
	test.describe(`on a phone held ${name}`, () => {
		test.use({ viewport, hasTouch: true, isMobile: true });
		test("fits one screen and a tap pauses", async ({ page }) => {
			await page.goto("/");
			await page.locator(".start").tap();
			const play = page.locator('button[title^="Play"]');
			await expect(play).toHaveText("❚❚");
			const fits = await page.evaluate(() => ({
				scrolls: document.documentElement.scrollHeight > innerHeight + 1,
				barBottom:
					document.querySelector(".bar")?.getBoundingClientRect().bottom ?? 0,
				height: innerHeight,
			}));
			expect(fits.scrolls).toBe(false);
			expect(fits.barBottom).toBeLessThanOrEqual(fits.height);
			const box = await page.locator(".view").boundingBox();
			if (!box) throw new Error("the picture (.view) has no box");
			await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
			await expect(play).toHaveText("▶");
		});
	});
}
