import type { Word } from "./types.ts";

/** A stretch of the audio where the voice is speaking: [start, end] in seconds. */
export type Span = [number, number];

/** The speaking spans of a clip `dur` seconds long, given its silences. */
export function speechSpans(dur: number, silences: Span[]): Span[] {
	const spans: Span[] = [];
	let at = 0;
	for (const [s, e] of [...silences].sort((a, b) => a[0] - b[0])) {
		if (s > at) spans.push([at, Math.min(s, dur)]);
		at = Math.max(at, e);
	}
	if (at < dur) spans.push([at, dur]);
	return spans.filter(([s, e]) => e - s > 0.04);
}

const weight = (token: string) => token.length + 1;
const round = (n: number) => Math.round(n * 1000) / 1000;

/** Spreads `tokens` across one stretch of speech in proportion to their length. */
function spread(tokens: string[], [s, e]: Span): Word[] {
	const total = tokens.reduce((a, t) => a + weight(t), 0);
	let done = 0;
	return tokens.map((text) => {
		const start = s + ((e - s) * done) / total;
		done += weight(text);
		return {
			text,
			start: round(start),
			end: round(s + ((e - s) * done) / total),
		};
	});
}

/**
 * Times each word of `line` against its audio.
 *
 * The voice pauses at full stops, colons and most commas, so the speaking
 * spans line up with the clauses. Clauses (split after punctuation) are grouped
 * onto spans in order, choosing the grouping whose share of the text best
 * matches each span's share of the speaking time; then the words of each group
 * share that span by length. If there are more spans than clauses (a pause
 * mid-clause), the words just share all the speaking time by length.
 */
export function wordTimes(line: string, spans: Span[]): Word[] {
	const tokens = line.split(/\s+/).filter(Boolean);
	if (!tokens.length || !spans.length)
		return tokens.map((text) => ({ text, start: 0, end: 0 }));

	const clauses: string[][] = [[]];
	for (const t of tokens) {
		clauses[clauses.length - 1].push(t);
		if (/[.,:;?!]["')\]]*$/.test(t)) clauses.push([]);
	}
	if (!clauses[clauses.length - 1].length) clauses.pop();

	const M = clauses.length;
	const N = spans.length;
	const speaking = spans.reduce((a, [s, e]) => a + (e - s), 0);
	if (N > M) {
		// Can't anchor every pause to punctuation: treat all speech as one stretch,
		// then map speaking time back to clip time so pauses are skipped.
		const flat = spread(tokens, [0, speaking]);
		const clock = (x: number) => {
			let left = x;
			for (const [s, e] of spans) {
				if (left <= e - s) return s + left;
				left -= e - s;
			}
			return spans[N - 1][1];
		};
		return flat.map((w) => ({
			...w,
			start: round(clock(w.start)),
			end: round(clock(w.end)),
		}));
	}

	const chars = clauses.map((c) => c.reduce((a, t) => a + weight(t), 0));
	const totalChars = chars.reduce((a, b) => a + b, 0);
	const prefix = [0];
	for (const c of chars) prefix.push(prefix[prefix.length - 1] + c);
	const cost = (from: number, to: number, span: number) =>
		Math.abs(
			(prefix[to] - prefix[from]) / totalChars -
				(spans[span][1] - spans[span][0]) / speaking,
		);

	// best[j][i]: cheapest way to put the first i clauses on the first j spans (≥ 1 clause each).
	const best = Array.from({ length: N + 1 }, () =>
		new Array<number>(M + 1).fill(Number.POSITIVE_INFINITY),
	);
	const from = Array.from({ length: N + 1 }, () =>
		new Array<number>(M + 1).fill(0),
	);
	best[0][0] = 0;
	for (let j = 1; j <= N; j++) {
		for (let i = j; i <= M - (N - j); i++) {
			for (let k = j - 1; k < i; k++) {
				const c = best[j - 1][k] + cost(k, i, j - 1);
				if (c < best[j][i]) {
					best[j][i] = c;
					from[j][i] = k;
				}
			}
		}
	}
	const groups: [number, number][] = [];
	for (let j = N, i = M; j > 0; i = from[j][i], j--)
		groups.unshift([from[j][i], i]);

	return groups.flatMap(([a, b], j) =>
		spread(clauses.slice(a, b).flat(), spans[j]),
	);
}
