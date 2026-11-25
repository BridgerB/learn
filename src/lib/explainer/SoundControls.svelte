<script lang="ts">
import { SPEEDS } from "./player.svelte.js";

interface Props {
	/** 0–1. */
	volume: number;
	muted: boolean;
	speed: number;
	onvolume: (v: number) => void;
	onmute: (muted: boolean) => void;
	onspeed: (s: number) => void;
}

let { volume, muted, speed, onvolume, onmute, onspeed }: Props = $props();

const silent = $derived(muted || volume === 0);
const options = SPEEDS.map((s) => ({ value: s, label: `${s}×` }));
</script>

<div class="sound">
	<button
		type="button"
		class="mute"
		title={silent ? "Unmute (M)" : "Mute (M)"}
		aria-pressed={silent}
		onclick={() => onmute(!muted)}
	>
		<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
			<path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
			{#if silent}
				<path
					d="M16 9l6 6M22 9l-6 6"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
				/>
			{:else}
				<path
					d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
				/>
			{/if}
		</svg>
	</button>
	<input
		type="range"
		min="0"
		max="1"
		step="0.05"
		value={muted ? 0 : volume}
		aria-label="Volume"
		aria-valuetext="{Math.round((muted ? 0 : volume) * 100)}%"
		style="--v:{(muted ? 0 : volume) * 100}%"
		oninput={(e) => onvolume(Number(e.currentTarget.value))}
	>
	<label class="speed">
		<span class="visually-hidden">Speed</span>
		<select
			title="Playback speed"
			value={speed}
			onchange={(e) => onspeed(Number(e.currentTarget.value))}
		>
			{#each options as o (o.value)}
				<option value={o.value}>{o.label}</option>
			{/each}
		</select>
	</label>
</div>

<style>
.sound {
	display: flex;
	align-items: center;
	gap: 8px;
}
.mute {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 6px 8px;
	background: var(--card);
	color: var(--ink);
	border: 1px solid var(--faint);
	border-radius: 8px;
	cursor: pointer;
}
.mute:hover {
	border-color: var(--cyan);
}
input {
	width: 84px;
	height: 20px;
	margin: 0;
	appearance: none;
	background: transparent;
	cursor: pointer;
}
input::-webkit-slider-runnable-track {
	height: 6px;
	border-radius: 3px;
	background: linear-gradient(
		to right,
		var(--cyan) var(--v),
		var(--faint) var(--v)
	);
}
input::-moz-range-track {
	height: 6px;
	border-radius: 3px;
	background: linear-gradient(
		to right,
		var(--cyan) var(--v),
		var(--faint) var(--v)
	);
}
input::-webkit-slider-thumb {
	appearance: none;
	width: 14px;
	height: 14px;
	margin-top: -4px;
	border-radius: 50%;
	background: var(--ink);
}
input::-moz-range-thumb {
	width: 14px;
	height: 14px;
	border: 0;
	border-radius: 50%;
	background: var(--ink);
}
select {
	font: inherit;
	font-family: var(--mono);
	font-size: 13px;
	font-weight: 600;
	color: var(--ink);
	background: var(--card);
	border: 1px solid var(--faint);
	border-radius: 8px;
	padding: 6px 8px;
	cursor: pointer;
}
select:hover {
	border-color: var(--cyan);
}
.visually-hidden {
	position: absolute;
	width: 1px;
	height: 1px;
	overflow: hidden;
	clip-path: inset(50%);
	white-space: nowrap;
}
/* last: the most specific of the control rules */
input:focus-visible,
select:focus-visible,
.mute:focus-visible {
	outline: 2px solid var(--cyan);
	outline-offset: 2px;
}
/* Phones have hardware volume buttons (and iOS ignores page volume): keep mute only. */
@media (pointer: coarse) {
	input {
		display: none;
	}
}
@media (max-height: 500px), (max-width: 600px) {
	.mute,
	select {
		padding: 3px 6px;
	}
}
</style>
