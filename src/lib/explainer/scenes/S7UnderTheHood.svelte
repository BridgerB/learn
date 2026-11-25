<script lang="ts">
import FlowArrow from "../FlowArrow.svelte";
import type { SceneProps } from "../timing.js";

let { t, at }: SceneProps = $props();
const on = (spec: string) => t >= at(spec);

// Three parts, one job each. Keep it that simple. A part's note lives inside
// its card, so it stays with that part in every layout.
const parts = [
	{ title: "Claude", sub: "writes the words", word: "Claude" },
	{
		title: "Kokoro",
		sub: "reads them, on your machine",
		word: "Kokoro",
		note: { label: "free · no cloud", word: "free" },
	},
	{ title: "SvelteKit", sub: "packs one HTML file", word: "Svelte" },
];
</script>

<div class="scene">
	<h2 class={["title r", { on: on("#0") }]}>Under the hood</h2>
	<div class="body">
		<p class={["md dim r", { on: on("simple-0.2") }]}>
			three parts, one job each
		</p>
		<div class="flow">
			{#each parts as p, i (p.word)}
				{#if i > 0}
					<FlowArrow on={on(`${p.word}-0.4`)} />
				{/if}
				<div class={["card pop", { on: on(`${p.word}-0.3`) }]}>
					<b>{p.title}</b>
					<small>{p.sub}</small>
					{#if p.note}
						<span class={["badge pop", { on: on(`${p.note.word}-0.2`) }]}
							>{p.note.label}</span
						>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>
