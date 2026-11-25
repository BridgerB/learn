# learn

A Claude Code skill that teaches. Type `/learn how DNS works` and you get back one `.html` file that walks you through the topic, one narrated scene at a time.

It plays like a video, but it is a web page. Every word is real text you can select and copy. The word being spoken lights up in the captions, and you can click any word or drag the timeline to jump. Scenes rearrange themselves to fit a wide window or a phone held upright. The file opens straight from disk, with no server and no internet, so you can keep it or send it to anyone.

See it: [bridgerb.github.io/learn](https://bridgerb.github.io/learn/). That page was made with learn.

## Install

```sh
mkdir -p ~/.claude/skills/learn
curl -fsSL https://raw.githubusercontent.com/BridgerB/learn/main/.claude/skills/learn/SKILL.md \
  -o ~/.claude/skills/learn/SKILL.md
```

Then type `/learn <topic>` in any project. It works on anything: `/learn what this PR changes`, `/learn why the tests are failing`, `/learn how DNS works`.

You need Node 24+, pnpm, ffmpeg, and Python 3.10–3.13. The first run downloads the voice, [Kokoro](https://huggingface.co/hexgrad/Kokoro-82M), into `~/.cache/learn` (about 340 MB). It is free and runs on your own machine.

## How it works

This repo is both the skill and the template it builds from. For each topic, Claude clones it, writes a script and one scene per line, records the voice, and builds the page:

```sh
pnpm new "how DNS works"   # start a page
pnpm narrate               # record data/script.json
pnpm build:html            # → build/learn.html, everything inlined
pnpm check:layout          # every scene on 5 screen shapes
```

The voice is the clock. Scene time is the narration's playback position, so picture and voice never drift.

## Develop

```sh
pnpm install
pnpm dev            # learn's own explainer, live
pnpm build:index    # rebuild index.html for the site
pnpm test           # unit + e2e
```

See `CLAUDE.md` for how the pieces fit together.
