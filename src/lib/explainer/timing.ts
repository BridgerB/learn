// Timing for one scene. The voice is the clock: a scene is its narration line
// plus a 0.3 s lead-in and 0.6 s of rest, and reveals land on the spoken word.

import type { Word } from "#lib/data/types.js";

export const LEAD = 0.3;
export const TAIL = 0.6;

export const sceneLength = (spoken: number) => spoken + LEAD + TAIL;

/** A word's text without punctuation, lowercased, for matching cues. */
const bare = (text: string) =>
	text.replace(/^[^\p{L}\p{N}]+/u, "").toLowerCase();

/**
 * Scene time when `word` (its nth match) starts being spoken. A cue matches a
 * word that starts with it, ignoring case and leading punctuation.
 */
export function cue(words: Word[], word: string, nth = 0): number {
	const want = word.toLowerCase();
	let i = 0;
	for (const w of words) {
		if (bare(w.text).startsWith(want) && i++ === nth) return LEAD + w.start;
	}
	throw new Error(
		`cue "${word}" is not in: ${words.map((w) => w.text).join(" ")}`,
	);
}

/**
 * A reveal time from a short spec:
 * "word", "word+0.3", "word-0.2", "word@1" (2nd match), "#1.5" (absolute seconds).
 */
export function timer(words: Word[]) {
	return (spec: string): number => {
		const m = spec.match(/^(#)?([^+@]+?)(?:@(\d+))?([+-][\d.]+)?$/);
		if (!m) throw new Error(`bad timing spec: ${spec}`);
		const base = m[1] ? Number(m[2]) : cue(words, m[2], Number(m[3] ?? 0));
		return base + Number(m[4] ?? 0);
	};
}

/** Index of the word being spoken at scene time `t`, or -1 before the first. */
export function wordAt(words: Word[], t: number): number {
	const s = t - LEAD;
	let found = -1;
	for (let i = 0; i < words.length && words[i].start <= s; i++) found = i;
	return found;
}

/** 63.25 → "1:03.2" */
export const clockTime = (s: number) =>
	`${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, "0")}`;

export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const easeOut = (p: number) => 1 - (1 - clamp(p)) ** 3;
/** A number that counts up from 0 to `to`, slowing as it lands. */
export const countUp = (
	t: number,
	start: number,
	len: number,
	to: number,
	dp = 0,
) => (to * easeOut((t - start) / len)).toFixed(dp);
/** Deterministic "random" in [0, 1) from integers: same look every time. */
export const hash = (...n: number[]) => {
	let h = 0;
	for (const v of n) h = Math.sin(h * 1.7 + v * 12.9898 + 78.233) * 43758.5453;
	return h - Math.floor(h);
};

export interface SceneProps {
	/** Seconds into this scene. */
	t: number;
	/** Narration length of this scene's line, in seconds. */
	spoken: number;
	/** Reveal time for a spec (see `timer`). */
	at: (spec: string) => number;
}
