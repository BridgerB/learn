import { describe, expect, it } from "vitest";
import type { Word } from "#lib/data/types.js";
import { speechSpans, wordTimes } from "#lib/data/words.js";
import { clockTime, cue, LEAD, sceneLength, timer, wordAt } from "./timing";

const words: Word[] = [
	{ text: "Step", start: 0, end: 0.3 },
	{ text: "one.", start: 0.3, end: 0.6 },
	{ text: "Step", start: 1.2, end: 1.5 },
	{ text: "two:", start: 1.5, end: 1.9 },
	{ text: "'pauses'", start: 2.4, end: 3 },
];

describe("cue", () => {
	it("is a word's start in scene time (after the lead-in)", () => {
		expect(cue(words, "one")).toBe(LEAD + 0.3);
	});

	it("finds the nth match, ignoring case and leading punctuation", () => {
		expect(cue(words, "step", 1)).toBe(LEAD + 1.2);
		expect(cue(words, "pauses")).toBe(LEAD + 2.4);
		expect(() => cue(words, "three")).toThrow(/not in/);
	});
});

describe("timer", () => {
	const at = timer(words);

	it("reads absolute times and offsets", () => {
		expect(at("#1.5")).toBe(1.5);
		expect(at("two+0.3")).toBeCloseTo(LEAD + 1.5 + 0.3);
		expect(at("two-0.2")).toBeCloseTo(LEAD + 1.5 - 0.2);
		expect(at("Step@1")).toBeCloseTo(LEAD + 1.2);
	});
});

describe("wordAt", () => {
	it("is the last word that has started, -1 before the first", () => {
		expect(wordAt(words, 0)).toBe(-1);
		expect(wordAt(words, LEAD + 0.31)).toBe(1);
		expect(wordAt(words, LEAD + 2)).toBe(3); // in the pause after "two:"
		expect(wordAt(words, 99)).toBe(4);
	});
});

describe("wordTimes", () => {
	it("anchors each clause to its own stretch of speech, skipping the pauses", () => {
		const spans = speechSpans(4, [
			[1, 1.5],
			[3, 4],
		]);
		expect(spans).toEqual([
			[0, 1],
			[1.5, 3],
		]);
		const timed = wordTimes("Hello there. Second part here.", spans);
		expect(timed.map((w) => w.text)).toEqual([
			"Hello",
			"there.",
			"Second",
			"part",
			"here.",
		]);
		expect(timed[0].start).toBe(0);
		expect(timed[2].start).toBe(1.5); // starts when the voice resumes, not mid-pause
		expect(timed[4].end).toBeCloseTo(3);
	});
});

it("formats clock times", () => {
	expect(clockTime(3.24)).toBe("0:03.2");
	expect(clockTime(63.25)).toBe("1:03.3");
});

it("a scene is its line plus the lead-in and a rest", () => {
	expect(sceneLength(10)).toBeCloseTo(10.9);
});
