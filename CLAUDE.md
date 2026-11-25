# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

This repo is the `/learn` Claude Code skill (`.claude/skills/learn/SKILL.md`) and the template it builds pages from. The template is a SvelteKit 3 app (Svelte 5 runes, Vite 8, TypeScript) that compiles to one self-contained HTML file. Its default content is learn's own explainer, published as `index.html` on GitHub Pages. The skill clones this repo from GitHub for each topic, so a change only reaches users once it is pushed.

## Commands

- `pnpm dev`: dev server (port from `autoPort()`). It builds the app data once per process, so restart it after changing anything in `data/`.
- `pnpm build:html`: `build/learn.html`, Biome-formatted. `pnpm build:index` also copies it to `index.html`.
- `pnpm setup:voice` once (Python 3.10–3.13 venv, model and voices in `~/.cache/learn`), then `pnpm narrate [line numbers]`.
- `pnpm check:layout`: every scene of the built file on 5 screen shapes; fails on overlap or overflow; screenshots in `build/layout/`. Pass scene numbers (1-based) to check only those.
- `pnpm check`, `pnpm lint` (Biome + ESLint), `pnpm format`.
- Tests: `pnpm test` runs both. One unit file: `pnpm exec vitest run src/lib/explainer/timing.spec.ts`; `*.svelte.spec.ts` run in a browser project, other specs in Node. One e2e test: `pnpm exec playwright test -g "<test name>"`; it builds and serves `vite preview` on the project's `portFromName()` port.
- Scripts in `scripts/*.ts` run directly with Node 24 (type stripping), so imports between them use `.ts` extensions.

## How it fits together

- `data/`: `script.json` (title, voice, speed, lines), `line<N>.wav`, `durs.json`, and `SKILL.md`, a symlink to the skill, embedded so the explainer can offer it for download. `scripts/data.ts` turns these into `AppData`: word timings from ffmpeg silence detection spread over each line's clauses (`src/lib/data/words.ts`), AAC audio (`aac_at` on macOS, because ffmpeg's native `aac` hangs), zstd-compressed, embedded by `scripts/build-html.ts` and served at `/app-data.zst` in dev.
- `src/lib/explainer/`: the player (`player.svelte.ts`, `Captions`, `Timeline`, `SoundControls`), the stage, and `scenes/S<n>*.svelte`, discovered by number and matched one-to-one with script lines. Scene time is the narration's playback position plus a 0.3 s lead (`timing.ts`), and scenes reveal elements with `on(cue)`, where a cue is a word in that line.
- `explainer.css`: the stage is a size container that fills the space above the player; scenes are CSS grid in a centred frame, sized in `var(--u)`, and switch to one column when the stage is taller than wide.

## Rules

- `pnpm new` deletes learn's own narration and scenes. It is for clones made by the skill; never run it in this repo.
- learn's narration has hand-spliced pauses after "Welcome to learn." and "So that is learn.". Re-record only the lines you change (`pnpm narrate 3`), and re-add those pauses if you touch lines 0 or 8.
- Single-file app: no server code, no page options, hash routing, assets imported so they inline.
- Scenes: no absolute positions or pixel sizes; reveals via `r` / `pop` / `wipe` + `on(cue)`. Run `pnpm check:layout` after any scene or CSS change, and look at the screenshots.
- Svelte: keyed `{#each}`, `class={[…]}`, attachments over `bind:this`, no `{@html}`; components should pass `svelte-autofixer`.
- "learn" is always lowercase. The voice is Kokoro `af_heart` at 1.15×.
- Changing `SKILL.md` changes the explainer's download too: rebuild `index.html`.
