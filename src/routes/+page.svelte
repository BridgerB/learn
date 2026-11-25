<script lang="ts">
import "#lib/explainer/explainer.css";
import { setContext } from "svelte";
import { Player } from "#lib/explainer/player.svelte.js";
import Captions from "#lib/explainer/Captions.svelte";
import SoundControls from "#lib/explainer/SoundControls.svelte";
import Stage from "#lib/explainer/Stage.svelte";
import Timeline from "#lib/explainer/Timeline.svelte";
import { clamp, wordAt } from "#lib/explainer/timing.js";
import type { PageProps } from "./$types";

let { data }: PageProps = $props();
const app = $derived(data.data);
const sceneIds = $derived(app.lines.map((_, k) => k));
const player = $derived(new Player(app.durs, app.audio));
// The last scene offers SKILL.md for download and as a copy-paste install command.
setContext("learn-skill", () => app.skill ?? "");
// "Watch again" on the last scene.
setContext("learn-restart", () => player.jump(0));
const words = $derived(app.words[player.idx]);
const current = $derived(player.started ? wordAt(words, player.t) : -1);

/**
 * Attachment: a click on the picture plays or pauses. A drag (to select and
 * copy text) doesn't, and neither does a click on a real control inside it.
 */
function clickToToggle(node: HTMLElement) {
	let downX = 0;
	let downY = 0;
	const down = (e: PointerEvent) => {
		downX = e.clientX;
		downY = e.clientY;
	};
	const click = (e: MouseEvent) => {
		if ((e.target as Element).closest("button, a, input, select, textarea"))
			return;
		if (Math.hypot(e.clientX - downX, e.clientY - downY) > 5) return; // a drag
		if (getSelection()?.toString()) return; // text was selected
		player.toggle();
	};
	node.addEventListener("pointerdown", down);
	node.addEventListener("click", click);
	return () => {
		node.removeEventListener("pointerdown", down);
		node.removeEventListener("click", click);
	};
}

const shortcuts = [
	{ keys: "click or tap the picture", does: "play / pause", touch: true },
	{ keys: "a word or the timeline", does: "jump there", touch: true },
	{ keys: "← →", does: "previous / next scene", touch: false },
	{ keys: "space", does: "play / pause", touch: false },
	{ keys: "A", does: "auto-advance", touch: false },
	{ keys: "C", does: "captions", touch: false },
	{ keys: "M", does: "mute", touch: false },
	{ keys: "R", does: "replay the scene", touch: false },
];

function onkeydown(e: KeyboardEvent) {
	if (e.metaKey || e.ctrlKey || e.altKey) return; // leave copy and other shortcuts alone
	// On a focused slider or the speed menu, ← → adjust it instead of changing scene.
	// (Space still toggles play everywhere: preventDefault below stops a focused
	// button from also being clicked by it.)
	const el = e.target as HTMLElement;
	if (
		(el.tagName === "INPUT" || el.tagName === "SELECT") &&
		(e.key === "ArrowLeft" || e.key === "ArrowRight")
	)
		return;
	const p = player;
	if (e.key === " ") {
		e.preventDefault();
		p.toggle();
	} else if (e.key === "ArrowRight") p.jump(p.started ? p.idx + 1 : 0);
	else if (e.key === "ArrowLeft" && p.started) p.go(p.idx - 1);
	else if (e.key === "a" || e.key === "A") p.setAuto(!p.auto);
	else if (e.key === "c" || e.key === "C") p.setCc(!p.cc);
	else if (e.key === "m" || e.key === "M") p.setMuted(!p.muted);
	else if ((e.key === "r" || e.key === "R") && p.started) p.go(p.idx);
}
</script>

<svelte:window {onkeydown} />
<svelte:head><title>{app.title}</title></svelte:head>

<div class="player" {@attach player.clock}>
	<div class="area">
		<div class="view" {@attach clickToToggle}>
			<Stage idx={player.idx} t={player.t} durs={app.durs} words={app.words} />
			{#if !player.started}
				<button type="button" class="start" onclick={() => player.jump(0)}>
					<i>▶</i><b>{app.title}</b
					><span>
						{player.count} scenes · click or press space to start · all text is
						selectable
					</span>
				</button>
			{/if}
		</div>
	</div>
	<div class="controls">
		<Captions
			{words}
			{current}
			hidden={!player.cc || !player.started}
			onseek={player.seek}
		/>
		<Timeline
			t={player.t}
			length={player.length(player.idx)}
			{words}
			onseek={player.seek}
		/>
		<div class="bar">
			<button
				type="button"
				title="Previous (←)"
				disabled={player.idx === 0}
				onclick={() => player.go(player.idx - 1)}
			>
				← <span class="label">Prev</span>
			</button>
			<button
				type="button"
				title={player.ended
					? "Play from the start (space)"
					: "Play / pause (space)"}
				onclick={player.toggle}
			>
				{player.running ? "❚❚" : player.ended ? "↻" : "▶"}
			</button>
			<button
				type="button"
				title="Next (→)"
				disabled={player.idx === player.count - 1}
				onclick={() => player.jump(player.started ? player.idx + 1 : 0)}
			>
				<span class="label">Next</span> →
			</button>
			<div class="dots">
				{#each sceneIds as k (k)}
					<button
						type="button"
						title="Scene {k + 1}"
						class={{ done: k < player.idx }}
						onclick={() => player.jump(k)}
					>
						<i
							style="width:{k === player.idx
								? (100 * clamp(player.t / player.length(k))).toFixed(1)
								: k < player.idx
									? 100
									: 0}%"
						></i>
					</button>
				{/each}
			</div>
			<span class="count">{player.idx + 1} / {player.count}</span>
			<SoundControls
				volume={player.volume}
				muted={player.muted}
				speed={player.speed}
				onvolume={player.setVolume}
				onmute={player.setMuted}
				onspeed={player.setSpeed}
			/>
			<button
				type="button"
				title="Auto-advance (A)"
				class={{ on: player.auto }}
				onclick={() => player.setAuto(!player.auto)}
			>
				Auto
			</button>
			<button
				type="button"
				title="Captions (C)"
				class={{ on: player.cc }}
				onclick={() => player.setCc(!player.cc)}
			>
				CC
			</button>
			<button
				type="button"
				class="help"
				title="Shortcuts"
				popovertarget="shortcuts"
			>
				?
			</button>
		</div>
		<div id="shortcuts" popover class="shortcuts">
			<p class="shortcuts-title">Shortcuts</p>
			<dl>
				{#each shortcuts as k (k.keys)}
					<dt class={{ "keys-only": !k.touch }}>{k.keys}</dt>
					<dd class={{ "keys-only": !k.touch }}>{k.does}</dd>
				{/each}
			</dl>
		</div>
	</div>
</div>

<style>
/* Always exactly one screen: the controls take what they need, the picture
   gets the rest, so nothing ever sits below the fold. */
.player {
	height: 100dvh;
	display: grid;
	grid-template-rows: minmax(0, 1fr) auto;
	justify-items: center;
	gap: 12px;
	padding: 16px;
}
.area {
	width: 100%;
	height: 100%;
	min-height: 0;
}
/* The stage takes all of the area, whatever its shape; scenes reflow inside it. */
.view {
	position: relative;
	width: 100%;
	height: 100%;
	border-radius: 12px;
	overflow: hidden;
	box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}
.start {
	position: absolute;
	inset: 0;
	z-index: 5;
	width: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 14px;
	background: rgba(10, 12, 17, 0.78);
	border: 0;
	color: var(--ink);
	font: inherit;
	cursor: pointer;
}
.start b {
	font-size: clamp(20px, 3vw, 34px);
}
.start span {
	color: var(--dim);
}
.start i {
	width: 84px;
	height: 84px;
	border-radius: 50%;
	background: var(--red);
	display: flex;
	align-items: center;
	justify-content: center;
	font-style: normal;
	font-size: 32px;
	padding-left: 6px;
}
.controls {
	width: min(100%, 1400px);
	display: flex;
	flex-direction: column;
	gap: 10px;
}
.bar {
	width: 100%;
}
.bar {
	display: flex;
	align-items: center;
	gap: 10px;
	flex-wrap: wrap;
}
.bar button {
	font: inherit;
	font-weight: 800;
	background: var(--card);
	color: var(--ink);
	border: 1px solid var(--faint);
	border-radius: 8px;
	padding: 7px 12px;
	cursor: pointer;
}
.bar button:hover {
	border-color: var(--cyan);
}
.bar button:disabled {
	opacity: 0.4;
	cursor: default;
}
.bar button.on {
	background: var(--cyan);
	border-color: var(--cyan);
	color: var(--bg);
}
.dots {
	display: flex;
	gap: 6px;
	flex: 1;
	min-width: 160px;
}
.bar .dots button {
	flex: 1;
	min-width: 0;
	height: 8px;
	padding: 0;
	border-radius: 4px;
	border: 0;
	background: var(--faint);
	position: relative;
	overflow: hidden;
}
.dots i {
	position: absolute;
	inset: 0 auto 0 0;
	background: var(--red);
}
.dots .done i {
	background: #7a2a26;
}
.count {
	color: var(--dim);
	font-family: var(--mono);
	font-size: 13px;
	min-width: 52px;
	text-align: right;
}
/* Shortcuts: a native popover above the bottom-right of the controls. */
.shortcuts {
	position: fixed;
	inset: auto 16px 72px auto;
	margin: 0;
	padding: 16px 20px;
	border: 1px solid var(--faint);
	border-radius: 12px;
	background: var(--card);
	color: var(--ink);
	font-size: 14px;
}
.shortcuts-title {
	margin: 0 0 10px;
	font-weight: 800;
}
.shortcuts dl {
	display: grid;
	grid-template-columns: auto auto;
	gap: 6px 18px;
	margin: 0;
}
.shortcuts dt {
	font-family: var(--mono);
	color: var(--cyan);
}
.shortcuts dd {
	margin: 0;
	color: var(--dim);
}
/* ---------- phones and small windows ---------- */
.view {
	touch-action: manipulation; /* taps respond at once, no double-tap zoom */
}
@media (max-width: 700px), (max-height: 500px) {
	.label {
		display: none;
	}
}
/* Short screens (a phone held sideways): every pixel of height goes to the picture. */
@media (max-height: 500px) {
	.player {
		padding: 6px 10px;
		gap: 6px;
	}
	.controls {
		gap: 4px;
	}
	.bar {
		flex-wrap: nowrap;
		gap: 6px;
	}
	.bar button {
		padding: 4px 9px;
		font-size: 13px;
	}
	.dots {
		min-width: 40px;
	}
}
/* Narrow screens (a phone held upright): smaller buttons so the bar wraps to two rows, not three. */
@media (max-width: 600px) {
	.bar {
		gap: 8px;
	}
	.bar button {
		padding: 5px 10px;
		font-size: 14px;
	}
}
@media (pointer: coarse) {
	.keys-only {
		display: none;
	}
}
</style>
