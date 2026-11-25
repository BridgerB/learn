<script lang="ts">
import FlowArrow from "../FlowArrow.svelte";
import Wave from "../Wave.svelte";
import type { SceneProps } from "../timing.js";

let { t, at }: SceneProps = $props();
const on = (spec: string) => t >= at(spec);

const scenes = [1, 2, 3, 4, 5, 6];
</script>

<!-- Type this → get that: across when wide, down when tall. -->
<div class="scene">
	<div class="body cause">
		<div class="stack">
			<h1 class={["hero r", { on: on("#0.2") }]}>learn</h1>
			<p class={["webpage pop", { on: on("web-0.2") }]}>
				a web page, not a video
			</p>
			<p class={["md dim r", { on: on("skill-0.2") }]}>a Claude Code skill</p>
			<p class={["cmd pop", { on: on("Type-0.2") }]}>
				/learn <span>&lt;topic&gt;</span>
			</p>
		</div>
		<FlowArrow on={on("page@1-0.4")} />
		<div class={["card plain r", { on: on("page@1-0.2") }]}>
			<b>a page that talks you through it</b>
			<div class={["wipe", { on: on("talks") }]}>
				<Wave w={620} h={80} seed={4} />
			</div>
			<div class={["strip r", { on: on("scene-0.2") }]}>
				{#each scenes as n (n)}
					<i class={{ cur: n === 1 }}></i>
				{/each}
			</div>
		</div>
	</div>
</div>
