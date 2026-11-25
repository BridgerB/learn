<script lang="ts">
import { clamp, hash } from "./timing.js";

interface Props {
	w: number;
	h: number;
	seed: number;
	/** Fractions [from, to] of the width that stay silent. */
	gaps?: [number, number][];
	/** Amber "music" bars instead of cyan voice bars. */
	music?: boolean;
	/** Music bars that sit under the voice and duck when `ducked` is on. */
	voiced?: (f: number) => boolean;
	ducked?: boolean;
}

let {
	w,
	h,
	seed,
	gaps = [],
	music = false,
	voiced,
	ducked = false,
}: Props = $props();

const bars = $derived.by(() => {
	const n = Math.floor(w / 12);
	const out: { id: number; y: number; h: number; v: boolean }[] = [];
	for (let i = 0; i < n; i++) {
		const f = i / n;
		if (gaps.some(([a, b]) => f >= a && f <= b)) continue;
		const amp =
			(0.25 + 0.75 * hash(seed, i)) *
			Math.sqrt(Math.sin(Math.PI * clamp(((f % 0.25) / 0.25) * 0.9 + 0.05)));
		const bh = Math.max(4, amp * h);
		out.push({ id: i, y: (h - bh) / 2, h: bh, v: voiced?.(f) ?? false });
	}
	return out;
});
</script>

<svg
	class={["wave", { music, duck: ducked }]}
	width={w}
	height={h}
	viewBox="0 0 {w} {h}"
	aria-hidden="true"
>
	{#each bars as bar (bar.id)}
		<rect
			x={bar.id * 12}
			y={bar.y}
			width="7"
			height={bar.h}
			rx="2"
			class={{ v: bar.v }}
		/>
	{/each}
</svg>
