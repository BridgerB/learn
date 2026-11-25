---
name: learn
description: Builds a narrated, single-file HTML explainer that walks through a topic one scene at a time, with a natural voice, spoken-word highlighting and a timeline. Use when the user types /learn with a topic.
argument-hint: [topic]
disable-model-invocation: true
---

# /learn

Make a page that teaches: $ARGUMENTS

The result is one `.html` file that opens straight from disk, with no server and no internet. It plays like a video, but it is a real web page: every word is selectable text, and each scene rearranges itself to fit a wide window or a phone held upright.

You do not build the player. It lives in the template repo, tested. You write the script and the scenes; the template does the rest.

## 0. Get the template

Needs Node 24+, pnpm, ffmpeg and Python 3.10–3.13.

```sh
dir="${TMPDIR:-/tmp}/learn-<topic-slug>"
git clone --depth 1 https://github.com/BridgerB/learn "$dir" && cd "$dir"
pnpm install
pnpm setup:voice    # once per machine: Kokoro voice into ~/.cache/learn (~340 MB); later runs skip it
```

Before writing anything, read in the clone:

- `src/lib/explainer/scenes/`: learn's own nine scenes, the worked examples to copy patterns from
- `src/lib/explainer/explainer.css`: the layout and type classes scenes are built from
- `src/lib/explainer/timing.ts`: `SceneProps` and the cue specs

## 1. Understand the topic

- If the topic is about the user's codebase (a PR, an issue, a bug, "why are the tests failing"), read the relevant code, diffs, logs or tickets first, in the user's project, not the clone. Use only facts you can point to.
- Otherwise, research it until you could explain it to a smart newcomer.
- Decide the 5–9 ideas that matter, in the order a learner needs them.

## 2. Write the script

Clear learn's own narration and scenes out of the clone (after reading the examples), then fill in the `lines` of `data/script.json`:

```sh
pnpm new "how DNS works"      # removes learn's content; writes a starter data/script.json
```

```json
{ "title": "how DNS works", "voice": "af_heart", "speed": 1.15, "lang": "en-us", "lines": ["…", "…"] }
```

- `title` is lowercase and short; it is the page title and the start screen.
- One line per scene, one idea per line, 6–15 seconds when spoken.
- Write for the ear: short sentences, plain words. The voice reads exactly what you write.
- Spell numbers and symbols as they are said ("point five", "minus one"). Write acronyms in plain capitals (HTML, DNS, PR), with no dots between the letters.
- Punctuation is the only timing control: a full stop pauses about half a second, a comma barely at all.
- Open with what the reader will get. End with a short recap.
- Never claim anything you have not checked. Say "estimate" when it is one.

## 3. Record the voice

```sh
pnpm narrate          # every line → data/line<N>.wav + data/durs.json
pnpm narrate 2 5      # after editing lines 2 and 5, re-record only those
```

Word timings come from the recording at build time; there is nothing else to do.

## 4. Write the scenes

One file per line: `src/lib/explainer/scenes/S0<Name>.svelte` for line 0, `S1<Name>.svelte` for line 1, and so on. The stage finds them by the number after the `S`; if the count does not match the lines, the page will not start and `check:layout` reports it.

Every scene has this shape:

```svelte
<script lang="ts">
import type { SceneProps } from "../timing.js";

let { t, at }: SceneProps = $props();
const on = (spec: string) => t >= at(spec);
</script>

<div class="scene">
	<h2 class={["title r", { on: on("#0") }]}>Records point to servers</h2>
	<div class="body split">
		<!-- … -->
	</div>
</div>
```

- **Timing.** Things appear as their word is spoken: `on("record")` is true from the first word in the line starting with "record". Specs: `"word"`, `"word@1"` (its second occurrence), `"word-0.3"` / `"word+0.5"` (seconds before or after), `"#1.5"` (seconds into the scene). Reveal with the classes `r` (rise), `pop` or `wipe` plus `{ on: … }`.
- **Layout.** No absolute positions and no pixel sizes. The stage has no fixed shape: it fills whatever space the window gives it. Lay scenes out with CSS grid and flex using the shared classes (`split`, `row`, `flow` with `FlowArrow`, `stack`, `band`, `cause`, `card`, `cmd`, `chip`, `pill`, `path`, `lg`, `md`, `sm`, colour classes) and size anything new as multiples of `var(--u)`. A scene sits in a centred frame; use `<div class="scene wide">` for a row of four or more cards. When the stage is taller than it is wide, `split`, `row`, `cause` and `flow` become one column on their own; check that your scene still reads top to bottom.
- **Composition.** Give each scene the shape of what it says (a sequence is a `flow`, cause and effect is a `cause`, a thing and its properties is a `split`), not a default two-column grid. Keep a note inside or right under the thing it describes, so they stay together in every layout. At most about 12 words on screen at once; the voice carries the explanation.
- **Code.** Svelte 5 runes; keyed `{#each}` with real IDs; `class={[…]}` not `class:`; no `{@html}`. New styles go in the scene's own `<style>`.

## 5. Check it

```sh
pnpm check && pnpm lint
pnpm build:html       # → build/learn.html
pnpm check:layout     # every scene on 5 screen shapes; must print "layout ok"
```

`check:layout` fails on any overlap, text spilling out, or item off the stage, and saves a screenshot of every scene to `build/layout/`. Fix every problem it reports, then look at the screenshots for at least `desktop-*` and `upright-*`: a passing check can still look wrong.

## 6. Ship one file

```sh
cp build/learn.html "<the user's current directory>/learn-<topic-slug>.html"
```

Tell the user the path, its length in seconds (the total `pnpm narrate` printed) and its size. Mention the clone's path in case they want changes; re-running steps 3–6 there updates the page.
