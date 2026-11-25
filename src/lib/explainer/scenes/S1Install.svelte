<script lang="ts">
import FlowArrow from "../FlowArrow.svelte";
import Mark from "../Mark.svelte";
import type { SceneProps } from "../timing.js";

let { t, at }: SceneProps = $props();
const on = (spec: string) => t >= at(spec);
</script>

<!-- Cause and effect, top to bottom: save this one file → it works everywhere. -->
<div class="scene">
	<h2 class={["title r", { on: on("#0") }]}>Install it</h2>
	<div class="body">
		<div class="install">
			<p class={["md dim r", { on: on("save-0.2") }]}>save one file</p>
			<div class="annotated">
				<p class={["path big pop", { on: on("skill-0.2") }]}>
					<span class="hot">~</span
					>/<wbr>.claude/<wbr>skills/<wbr>learn/<wbr><span class="hot"
						>SKILL.md</span
					>
				</p>
				<p class={["sm note r", { on: on("home-0.2") }]}>
					<span class="amber">↑ ~</span> = your home folder
				</p>
			</div>
			<p class={["step md dim r", { on: on("whole-0.2") }]}>
				<FlowArrow down on={on("whole-0.2")} />that's the whole setup
			</p>
			<p class={["lg mark r", { on: on("every-0.3") }]}>
				<Mark kind="tick" /><span
					><span class="amber mono">/learn</span> now works in every
					project</span
				>
			</p>
		</div>
	</div>
</div>
