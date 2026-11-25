<script lang="ts">
import type { Word } from "#lib/data/types.js";
import { clockTime, LEAD } from "./timing.js";

interface Props {
	/** Seconds into the current scene. */
	t: number;
	/** The current scene's length, in seconds. */
	length: number;
	/** The current scene's words: each gets a tick on the timeline. */
	words: Word[];
	/** Jump to a scene time. */
	onseek: (t: number) => void;
}

let { t, length, words, onseek }: Props = $props();

const ticks = $derived(
	words.map((w, i) => ({
		id: i,
		at: LEAD + w.start,
		pct: ((LEAD + w.start) / length) * 100,
	})),
);
const pct = $derived(Math.min(100, (Math.max(0, t) / length) * 100));
</script>

<div class="timeline">
	<span class="time">{clockTime(Math.min(t, length))}</span>
	<div class="track" style="--p:{pct}%">
		{#each ticks as tick (tick.id)}
			<i class={["tick", { past: tick.at <= t }]} style="left:{tick.pct}%"></i>
		{/each}
		<input
			type="range"
			min="0"
			max={length}
			step="0.01"
			value={Math.min(t, length)}
			aria-label="Position in this scene"
			aria-valuetext="{clockTime(Math.min(t, length))} of {clockTime(length)}"
			oninput={(e) => onseek(Number(e.currentTarget.value))}
		>
	</div>
	<span class="time">{clockTime(length)}</span>
</div>

<style>
.timeline {
	width: 100%;
	display: flex;
	align-items: center;
	gap: 12px;
}
.time {
	font-family: var(--mono);
	font-size: 13px;
	color: var(--dim);
	min-width: 52px;
}
.time:last-child {
	text-align: right;
}
.track {
	position: relative;
	flex: 1;
	height: 28px;
	display: flex;
	align-items: center;
}
.track::before {
	content: "";
	position: absolute;
	left: 0;
	right: 0;
	height: 6px;
	border-radius: 3px;
	background: linear-gradient(
		to right,
		var(--cyan) var(--p),
		var(--faint) var(--p)
	);
}
.tick {
	position: absolute;
	top: 6px;
	width: 2px;
	height: 16px;
	margin-left: -1px;
	border-radius: 1px;
	background: var(--faint);
	pointer-events: none;
}
.tick.past {
	background: var(--cyan);
}
input {
	position: relative;
	width: 100%;
	height: 28px;
	margin: 0;
	background: transparent;
	appearance: none;
	cursor: pointer;
}
input::-webkit-slider-runnable-track {
	height: 28px;
	background: transparent;
}
input::-moz-range-track {
	height: 28px;
	background: transparent;
}
input::-webkit-slider-thumb {
	appearance: none;
	width: 16px;
	height: 16px;
	margin-top: 6px;
	border-radius: 50%;
	background: var(--ink);
	box-shadow: 0 0 0 3px var(--cyan);
}
input::-moz-range-thumb {
	width: 16px;
	height: 16px;
	border: 0;
	border-radius: 50%;
	background: var(--ink);
	box-shadow: 0 0 0 3px var(--cyan);
}
input:focus-visible {
	outline: 2px solid var(--cyan);
	outline-offset: 4px;
	border-radius: 6px;
}
</style>
