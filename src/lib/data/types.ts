// The shape of the data embedded in the app, shared by scripts/data.ts (which
// builds it) and the app (which reads it).

/** One spoken word, timed in seconds from the start of its line's audio. */
export interface Word {
	text: string;
	start: number;
	end: number;
}

export interface AppData {
	title: string;
	/** One narration line per scene, in order. */
	lines: string[];
	/** Spoken length of each line, in seconds. */
	durs: number[];
	/** Each line split into words, timed against its audio. */
	words: Word[][];
	/** Each line's narration as an AAC (.m4a) file, base64. */
	audio: string[];
	/** The /learn skill file (SKILL.md); only learn's own explainer embeds it. */
	skill?: string;
}
