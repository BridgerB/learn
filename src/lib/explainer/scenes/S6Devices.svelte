<script lang="ts">
import type { SceneProps } from "../timing.js";

let { t, at }: SceneProps = $props();
const on = (spec: string) => t >= at(spec);

// The same little scene in two windows. Both windows narrow to phone shape:
// the video's picture just shrinks; learn's cards restack (a real container
// query on the mock window, so it reflows as the width animates).
const cards = ["script", "voice", "scenes"];
</script>

{#snippet content()}
	<div class="mini">
		<b>Ask for anything</b>
		<div class="mini-cards">
			{#each cards as c (c)}
				<span>{c}</span>
			{/each}
		</div>
	</div>
{/snippet}

<div class="scene">
	<h2 class={["title r", { on: on("#0") }]}>Laptop or phone</h2>
	<div class="body">
		<div class="compare">
			<div class={["panel r", { on: on("laptop-0.2") }]}>
				<div class="box">
					<div class={["win video", { narrow: on("shrink-0.2") }]}>
						<div class="win-bar"><i></i><i></i><i></i></div>
						<div class="win-body">
							<div class="pic">{@render content()}</div>
						</div>
					</div>
				</div>
				<p class="panel-cap">
					<span class="sm dim">a video</span>
					<span class={["sm red r", { on: on("shrink") }]}>just shrinks</span>
				</p>
			</div>
			<div class={["panel r", { on: on("laptop-0.2") }]}>
				<div class="box">
					<div class={["win learn", { narrow: on("narrow-0.2") }]}>
						<div class="win-bar"><i></i><i></i><i></i></div>
						<div class="win-body">{@render content()}</div>
					</div>
				</div>
				<p class="panel-cap">
					<span class="sm dim">learn</span>
					<span class={["sm amber r", { on: on("rearranges-0.2") }]}
						>rearranges</span
					>
				</p>
			</div>
		</div>
		<p class={["sm cyan r", { on: on("fits-0.2") }]}>
			try it now: <span class="fine-only">resize this window</span
			><span class="touch-only">turn your phone</span>
		</p>
	</div>
</div>
