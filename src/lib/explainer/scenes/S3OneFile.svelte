<script lang="ts">
import Mark from "../Mark.svelte";
import type { SceneProps } from "../timing.js";

let { t, at }: SceneProps = $props();
const on = (spec: string) => t >= at(spec);

const inside = [
	{ label: "the voice", at: "#1.6" },
	{ label: "the scenes", at: "#2.0" },
	{ label: "the words", at: "#2.4" },
];
const without = [
	{ label: "no server", word: "server" },
	{ label: "no internet", word: "internet" },
];
</script>

<div class="scene">
	<h2 class={["title r", { on: on("#0") }]}>One HTML file</h2>
	<div class="body split">
		<div class={["file pop", { on: on("#0.4") }]}>
			<p class="file-name">your-topic.html</p>
			{#each inside as c (c.label)}
				<p class={["chip pop", { on: on(c.at) }]}>{c.label}</p>
			{/each}
		</div>
		<div class="stack">
			<p class={["lg r", { on: on("disk-0.3") }]}>opens straight from disk</p>
			<ul class="list">
				{#each without as w (w.word)}
					<li class={["md mark r", { on: on(`${w.word}-0.2`) }]}>
						<Mark kind="cross" /><span>{w.label}</span>
					</li>
				{/each}
			</ul>
			<p class={["lg amber r", { on: on("keep-0.2") }]}>keep it · send it</p>
		</div>
	</div>
</div>
