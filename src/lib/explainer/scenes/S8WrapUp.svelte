<script lang="ts">
import { getContext } from "svelte";
import { copyText, downloadSkill, installCommand } from "../install.js";
import type { SceneProps } from "../timing.js";

let { t, at }: SceneProps = $props();
const on = (spec: string) => t >= at(spec);

/** SKILL.md's text, provided by the page (it comes from the embedded data). */
const skill = getContext<() => string>("learn-skill");
const restart = getContext<() => void>("learn-restart");

const REPO = "https://github.com/BridgerB/learn";
const PAGE = "https://bridgerb.github.io/learn/";
const FIRST_TRY = "/learn how DNS works";

const recap = [
	{ n: 1, label: "type a topic", word: "type" },
	{ n: 2, label: "get a page that teaches it", word: "teaches" },
	{ n: 3, label: "this page was made using learn", word: "made" },
];

/** Which button last copied something, for its "Copied ✓" moment. */
let copied = $state("");
async function copy(what: string, text: string) {
	if (await copyText(text)) copied = what;
	setTimeout(() => {
		if (copied === what) copied = "";
	}, 2000);
}
/** The system share sheet where there is one (phones); else copy the link. */
async function share() {
	const data = {
		title: "learn",
		text: "A Claude Code skill that teaches",
		url: PAGE,
	};
	if (navigator.share) {
		try {
			await navigator.share(data);
		} catch {
			// cancelled
		}
	} else await copy("share", PAGE);
}
</script>

<div class="scene">
	<h2 class={["title r", { on: on("#0.2") }]}>So that's learn</h2>
	<div class="body split">
		<div class="stack">
			<ol class="recap">
				{#each recap as r (r.n)}
					<li class={["r", { on: on(`${r.word}-0.2`) }]}>
						<span class="recap-n">{r.n}</span>{r.label}
					</li>
				{/each}
			</ol>
		</div>
		<!-- What to do next, in the order you'd do it: get it, try it, pass it on. -->
		<div class={["cta r", { on: on("using-0.2") }]}>
			<span class="label-sm">get it</span>
			<button
				type="button"
				class="primary"
				onclick={() => downloadSkill(skill())}
			>
				<svg viewBox="0 0 24 24" aria-hidden="true">
					<path
						d="M12 3v12M6 10l6 6 6-6M4 20h16"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
				Download SKILL.md
			</button>
			<button
				type="button"
				class={{ done: copied === "install" }}
				onclick={() => copy("install", installCommand(skill()))}
			>
				<svg viewBox="0 0 24 24" aria-hidden="true">
					<path
						d="M9 9h11v11H9zM5 15H4V4h11v1"
						fill="none"
						stroke="currentColor"
						stroke-width="2.2"
						stroke-linejoin="round"
					/>
				</svg>
				{copied === "install" ? "Copied ✓" : "Copy install command"}
			</button>
			<span class="label-sm">then try</span>
			<button
				type="button"
				class={["try", { done: copied === "try" }]}
				title="Copy this, then paste it into Claude Code"
				onclick={() => copy("try", FIRST_TRY)}
			>
				<span class="amber">/learn</span> how DNS works
				<small>{copied === "try" ? "copied ✓" : "copy"}</small>
			</button>
			<div class="cta-more">
				<a
					class={{ hot: on("github-0.1") }}
					href={REPO}
					target="_blank"
					rel="noopener noreferrer"
					>★ Star on GitHub</a
				>
				<button
					type="button"
					class={{ done: copied === "share" }}
					onclick={share}
				>
					{copied === "share" ? "Link copied ✓" : "Share this page"}
				</button>
				<button type="button" onclick={restart}>↻ Watch again</button>
			</div>
		</div>
	</div>
</div>
