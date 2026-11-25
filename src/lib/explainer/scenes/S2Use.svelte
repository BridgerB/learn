<script lang="ts">
import FlowArrow from "../FlowArrow.svelte";
import type { SceneProps } from "../timing.js";

let { t, at }: SceneProps = $props();
const on = (spec: string) => t >= at(spec);

const asks = [
	{ topic: "how DNS works", cue: "how-0.3" },
	{ topic: "what this PR changes", cue: "what-0.3" },
	{ topic: "why the tests are failing", cue: "why-0.3" },
];
const steps = [
	{ title: "a script", sub: "Claude writes it", word: "script" },
	{ title: "a voice", sub: "reads it aloud", word: "voice" },
	{ title: "scenes", sub: "built to match", word: "scenes" },
];
</script>

<div class="scene">
	<h2 class={["title r", { on: on("#0") }]}>Ask for anything</h2>
	<div class="body">
		<div class="stack">
			{#each asks as a (a.topic)}
				<p class={["cmd pop", { on: on(a.cue) }]}>
					/learn <span>{a.topic}</span>
				</p>
			{/each}
		</div>
		<div class="flow">
			{#each steps as s, i (s.word)}
				{#if i > 0}
					<FlowArrow on={on(`${s.word}-0.4`)} />
				{/if}
				<div class={["card pop", { on: on(`${s.word}-0.3`) }]}>
					<b>{s.title}</b>
					<small>{s.sub}</small>
				</div>
			{/each}
		</div>
	</div>
</div>
