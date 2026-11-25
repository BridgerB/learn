<script lang="ts">
import type { Word } from "#lib/data/types.js";
import { LEAD } from "./timing.js";

interface Props {
	/** The current scene's words. */
	words: Word[];
	/** Index of the word being spoken (-1 before the first). */
	current: number;
	hidden: boolean;
	/** Jump to a scene time. */
	onseek: (t: number) => void;
}

let { words, current, hidden, onseek }: Props = $props();

// `space` is a real space after each word (not drawn: the flex gap spaces the
// words), so copying the caption gives "a home for", not "ahomefor".
const items = $derived(
	words.map((w, i) => ({
		id: i,
		text: w.text,
		at: LEAD + w.start,
		space: i < words.length - 1 ? " " : "",
	})),
);
</script>

<p class={["cap", { hidden }]}>
	{#each items as w (w.id)}
		<button
			type="button"
			class={["word", { said: w.id < current, now: w.id === current }]}
			title="Jump to “{w.text}”"
			onclick={() => onseek(w.at)}
		>
			{w.text}
		</button>{w.space}
	{/each}
</p>

<style>
/* Words are buttons in a wrapping row; the gap is the space between them. */
.cap {
	width: 100%;
	min-height: 3.2em;
	margin: 0;
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	align-content: flex-start;
	column-gap: 0.12em;
	font-size: clamp(15px, 1.7vw, 20px);
	font-weight: 500;
	line-height: 1.6;
}
.cap.hidden {
	visibility: hidden;
}
.word {
	font: inherit;
	color: var(--dim);
	background: none;
	border: 0;
	border-radius: 5px;
	padding: 1px 3px;
	margin: 0 -1px;
	cursor: pointer;
	transition:
		color 0.15s,
		background-color 0.15s;
}
.word:hover {
	background: var(--faint);
}
.word.said {
	color: var(--ink);
}
.word.now {
	color: var(--bg);
	background: var(--amber);
}
@media (max-height: 500px) {
	.cap {
		min-height: 2.7em;
		font-size: 13px;
		line-height: 1.35;
	}
}
</style>
