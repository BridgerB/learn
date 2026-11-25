<script lang="ts">
import { getContext } from "svelte";
import { copyText, downloadSkill } from "../install.js";
import type { SceneProps } from "../timing.js";

let { t, at }: SceneProps = $props();
const on = (spec: string) => t >= at(spec);

const speeds = ["0.75×", "1×", "1.5×", "2×"];
// The three page abilities are live demos: each animates on its spoken word,
// and each really works when clicked.
const skill = getContext<() => string>("learn-skill");
const REPO = "https://github.com/BridgerB/learn";
const SAMPLE = "/learn how DNS works";
let copiedNow = $state(false);
async function copySample() {
	copiedNow = await copyText(SAMPLE);
	setTimeout(() => (copiedNow = false), 2000);
}
</script>

<!-- Two bands, in narration order: the player's controls, then what the page
     itself lets you do. Each band is a row that wraps to fit. -->
<div class="scene">
	<h2 class={["title r", { on: on("#0") }]}>Your controls</h2>
	<div class="body">
		<div class="band">
			<div class={["r", { on: on("Slow-0.2") }]}>
				<span class="label-sm">speed</span>
				<div class="pills">
					{#each speeds as s (s)}
						<span class={["pill", { on: s === "1.5×" }]}>{s}</span>
					{/each}
				</div>
			</div>
			<div class={["r", { on: on("captions-0.2") }]}>
				<span class="label-sm">captions</span>
				<div class="pills"><span class="pill">CC</span></div>
			</div>
			<div class={["r", { on: on("straight-0.2") }]}>
				<span class="label-sm">play straight through</span>
				<div class="pills"><span class="pill on">Auto</span></div>
			</div>
		</div>
		<div class="band-split">
			<p class={["md dim r", { on: on("real-0.2") }]}>
				it's a real web page, so you can
			</p>
			<div class="demos">
				<button
					type="button"
					class={["demo r", { on: on("copy-0.2") }]}
					title="Copy it"
					onclick={copySample}
				>
					<span class="demo-k">copy text and commands</span>
					<span class="demo-v mono">
						<span class={["sweep", { on: on("copy") }]}></span>
						<span class="amber nowrap">/learn</span> how DNS works
					</span>
					<span class={["demo-done pop", { on: copiedNow || on("text+0.2") }]}>
						Copied ✓
					</span>
				</button>
				<a
					class={["demo r", { on: on("links-0.2") }]}
					href={REPO}
					target="_blank"
					rel="noopener noreferrer"
				>
					<span class="demo-k">follow links</span>
					<span class="demo-v mono">
						<span class={["link-demo", { on: on("links") }]}
							>github.com/<wbr>BridgerB/<wbr>learn</span
						>
						<svg
							class={["pointer", { on: on("links") }]}
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								d="M5 3l14 8-6 1.5L16 20l-3 1.3-3-7.3L5 18z"
								fill="var(--ink)"
								stroke="var(--bg)"
								stroke-width="1.2"
							/>
						</svg>
					</span>
					<span class={["demo-done pop", { on: on("links+0.5") }]}
						>↗ opens in a new tab</span
					>
				</a>
				<button
					type="button"
					class={["demo r", { on: on("download-0.2") }]}
					title="Download SKILL.md"
					onclick={() => downloadSkill(skill())}
				>
					<span class="demo-k">download files</span>
					<span class="demo-v mono">
						<svg
							class={["dl-arrow", { on: on("download") }]}
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								d="M12 3v12M6 10l6 6 6-6M4 20h16"
								fill="none"
								stroke="var(--cyan)"
								stroke-width="2.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
						SKILL.md
					</span>
					<span class="dl-bar"
						><b style="width: {on("download") ? 100 : 0}%"></b></span
					>
					<span class={["demo-done pop", { on: on("download+0.9") }]}
						>✓ saved</span
					>
				</button>
			</div>
		</div>
	</div>
</div>
