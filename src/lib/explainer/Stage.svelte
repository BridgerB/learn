<script lang="ts">
import type { Component } from "svelte";
import type { Word } from "#lib/data/types.js";
import { type SceneProps, sceneLength, timer } from "./timing.js";

interface Props {
	/** The scene on screen. */
	idx: number;
	/** Seconds into that scene. */
	t: number;
	durs: number[];
	/** Each scene line, split into timed words. */
	words: Word[][];
}

let { idx, t, durs, words }: Props = $props();

// One component per narration line, in script order: scenes/S0*.svelte for
// line 0, S1* for line 1, and so on. Adding a scene is adding a file.
const files = import.meta.glob<{ default: Component<SceneProps> }>(
	"./scenes/S*.svelte",
	{ eager: true },
);
const number = (path: string) =>
	Number(/\/S(\d+)/.exec(path)?.[1] ?? Number.NaN);
const SCENES = Object.keys(files)
	.sort((a, b) => number(a) - number(b))
	.map((path) => files[path].default);

const scenes = $derived.by(() => {
	if (words.length !== SCENES.length)
		throw new Error(
			`${SCENES.length} scenes but ${words.length} narration lines`,
		);
	return words.map((line, k) => ({
		id: k,
		Scene: SCENES[k],
		spoken: durs[k],
		at: timer(line),
	}));
});
</script>

<div class="stage">
	{#each scenes as s (s.id)}
		<!-- Scenes already played stay fully revealed, so they don't un-reveal while fading out. -->
		<section
			class={{ cur: s.id === idx }}
			aria-hidden={s.id !== idx}
			aria-label="Scene {s.id + 1}"
		>
			<s.Scene
				t={s.id < idx ? sceneLength(s.spoken) : s.id === idx ? t : 0}
				spoken={s.spoken}
				at={s.at}
			/>
		</section>
	{/each}
	<footer class="foot">
		<nav aria-label="Scene progress">
			{#each scenes as s (s.id)}
				<i class={["dot", { cur: s.id === idx }]}></i>
			{/each}
		</nav>
	</footer>
</div>
