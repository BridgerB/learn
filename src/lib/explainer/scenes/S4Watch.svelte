<script lang="ts">
import type { SceneProps } from "../timing.js";

let { t, at }: SceneProps = $props();
const on = (spec: string) => t >= at(spec);

// A large mock of the player: the caption lights up the spoken word, and the
// timeline thumb jumps when "drag" is said.
const caption = ["the", "word", "being", "spoken", "lights", "up"];
// Each mock word lights as the narrator actually says it.
const lit = $derived(caption.reduce((last, w, i) => (on(w) ? i : last), -1));
const dragged = $derived(on("drag"));
</script>

<div class="scene">
	<h2 class={["title r", { on: on("#0") }]}>It walks you through</h2>
	<div class="body">
		<div class={["card plain mock r", { on: on("play-0.3") }]}>
			<div class="mock-head">
				<div class="play-disc" aria-hidden="true">
					<svg viewBox="0 0 44 50" aria-hidden="true">
						<path d="M4 2L42 25L4 48Z" fill="#fff" />
					</svg>
				</div>
				<p class={["mock-cap r", { on: on("word-0.3") }]}>
					{#each caption as w, i (i)}
						<span class={{ said: i < lit, hl: i === lit }}>{w}</span>
					{/each}
				</p>
			</div>
			<div class={["mock-track r", { on: on("drag-0.4") }]}>
				<b style="width: {dragged ? 72 : 30}%"></b>
				<i style="left: {dragged ? 72 : 30}%"></i>
			</div>
			<div class="row">
				<p class={["sm cyan r", { on: on("click-0.2") }]}>click any word</p>
				<p class={["sm cyan r", { on: on("drag-0.2") }]}>
					or drag the timeline
				</p>
			</div>
		</div>
	</div>
</div>
