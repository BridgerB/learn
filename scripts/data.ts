// The data this app ships with: the narration script, each line's spoken
// length and word timings, and the narration audio. Built here at build time
// and embedded in the single HTML file (scripts/build-html.ts) or served to the
// dev server (vite.config.ts).
//
// Source files live in data/: script.json (title + lines), and durs.json +
// line<N>.wav as `pnpm narrate` writes them. data/SKILL.md is optional: when
// present (only in learn's own explainer) it is embedded for download.

import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { constants, zstdCompressSync } from "node:zlib";
import type { AppData } from "../src/lib/data/types.ts";
import { type Span, speechSpans, wordTimes } from "../src/lib/data/words.ts";

const DIR = "data";

/**
 * WAV → AAC in an .m4a, which every browser plays. macOS uses Apple's
 * AudioToolbox encoder: Homebrew ffmpeg 9.1's native `aac` hung on these files.
 */
function encode(wav: string): string {
	const tmp = mkdtempSync(join(tmpdir(), "narration-"));
	const out = join(tmp, "line.m4a");
	try {
		const codec = process.platform === "darwin" ? "aac_at" : "aac";
		const r = spawnSync(
			"ffmpeg",
			[
				"-y",
				"-v",
				"error",
				"-i",
				wav,
				"-c:a",
				codec,
				"-b:a",
				"64k",
				"-movflags",
				"+faststart",
				out,
			],
			{ encoding: "utf8" },
		);
		if (r.status !== 0) throw new Error(`ffmpeg failed on ${wav}: ${r.stderr}`);
		return readFileSync(out).toString("base64");
	} finally {
		rmSync(tmp, { recursive: true, force: true });
	}
}

/**
 * Where the voice is silent: ≥ 0.12 s below −35 dB (the same settings as the
 * video kit's pauses.ts). Full stops, colons and most commas show up here.
 */
function silences(wav: string): Span[] {
	const r = spawnSync(
		"ffmpeg",
		[
			"-hide_banner",
			"-i",
			wav,
			"-af",
			"silencedetect=noise=-35dB:d=0.12",
			"-f",
			"null",
			"-",
		],
		{ encoding: "utf8" },
	);
	if (r.status !== 0)
		throw new Error(`silencedetect failed on ${wav}: ${r.stderr}`);
	const starts = [...r.stderr.matchAll(/silence_start: ([\d.]+)/g)].map((m) =>
		Number(m[1]),
	);
	const ends = [...r.stderr.matchAll(/silence_end: ([\d.]+)/g)].map((m) =>
		Number(m[1]),
	);
	return starts.map((s, i) => [s, ends[i] ?? Number.POSITIVE_INFINITY]);
}

let cached: AppData | null = null;

export function buildData(): AppData {
	if (cached) return cached;
	const { title = "learn", lines } = JSON.parse(
		readFileSync(join(DIR, "script.json"), "utf-8"),
	) as { title?: string; lines: string[] };
	const durs = JSON.parse(
		readFileSync(join(DIR, "durs.json"), "utf-8"),
	) as number[];
	if (durs.length !== lines.length) {
		throw new Error(
			`data/durs.json has ${durs.length} lines but script.json has ${lines.length}: re-run pnpm narrate`,
		);
	}
	const wavs = lines.map((_, i) => join(DIR, `line${i}.wav`));
	const words = lines.map((line, i) =>
		wordTimes(line, speechSpans(durs[i], silences(wavs[i]))),
	);
	const audio = wavs.map(encode);
	const skillPath = join(DIR, "SKILL.md");
	const skill = existsSync(skillPath)
		? readFileSync(skillPath, "utf-8")
		: undefined;
	cached = { title, lines, durs, words, audio, skill };
	return cached;
}

/**
 * JSON, compressed once with zstd at its maximum level. Browsers can't decode
 * zstd natively, so the app uses fzstd (src/lib/data/load.ts).
 */
export function packData(data: AppData = buildData()) {
	return zstdCompressSync(JSON.stringify(data), {
		params: {
			[constants.ZSTD_c_compressionLevel]: 22,
			[constants.ZSTD_c_enableLongDistanceMatching]: 1,
			[constants.ZSTD_c_windowLog]: 27,
		},
	});
}
