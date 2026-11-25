import { clamp, LEAD, sceneLength } from "./timing.js";

const remembered = (key: string, fallback: boolean) => {
	try {
		const v = localStorage.getItem(key);
		return v === null ? fallback : v === "true";
	} catch {
		return fallback;
	}
};
/** A remembered number, kept only if it passes `ok`. */
const rememberedNumber = (
	key: string,
	fallback: number,
	ok: (n: number) => boolean,
) => {
	try {
		const v = Number(localStorage.getItem(key) ?? Number.NaN);
		return Number.isFinite(v) && ok(v) ? v : fallback;
	} catch {
		return fallback;
	}
};
const remember = (key: string, value: boolean | number) => {
	try {
		localStorage.setItem(key, String(value));
	} catch {
		/* private mode: the setting just isn't kept */
	}
};

/** Playback speeds offered in the speed menu. */
export const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

/** base64 .m4a → an <audio> element on a Blob URL (works from file://). */
function toAudio(b64: string) {
	const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
	const el = new Audio(
		URL.createObjectURL(new Blob([bytes], { type: "audio/mp4" })),
	);
	el.preload = "auto";
	return el;
}

/**
 * Plays the scenes. The voice is the clock: while a line plays, scene time `t`
 * is that line's audio position, so picture and voice can't drift apart.
 */
export class Player {
	idx = $state(0);
	/** Seconds into the current scene. Before starting, scene 1 sits fully revealed. */
	t = $state(999);
	running = $state(false);
	started = $state(false);
	auto = $state(remembered("vfc-auto", true));
	cc = $state(remembered("vfc-cc", true));
	/** 0–1. */
	volume = $state(rememberedNumber("vfc-volume", 1, (n) => n >= 0 && n <= 1));
	muted = $state(remembered("vfc-muted", false));
	/** Playback speed; the whole scene (voice and animation) runs at this rate. */
	speed = $state(rememberedNumber("vfc-speed", 1, (n) => SPEEDS.includes(n)));

	readonly count: number;
	#lengths: number[];
	#audios: HTMLAudioElement[];
	#audioOn = false;

	constructor(durs: number[], audio: string[]) {
		this.count = durs.length;
		this.#lengths = durs.map(sceneLength);
		this.#audios = audio.map(toAudio);
		this.#applySound();
	}

	/** Volume, mute and speed onto every line's audio (the pitch stays natural). */
	#applySound() {
		for (const a of this.#audios) {
			a.volume = this.volume;
			a.muted = this.muted;
			a.playbackRate = this.speed;
			a.preservesPitch = true;
		}
	}

	setVolume = (value: number) => {
		this.volume = clamp(value);
		remember("vfc-volume", this.volume);
		// Turning the volume up from silence also unmutes.
		if (this.volume > 0 && this.muted) this.setMuted(false);
		else this.#applySound();
	};

	setMuted = (value: boolean) => {
		this.muted = value;
		remember("vfc-muted", value);
		this.#applySound();
	};

	setSpeed = (value: number) => {
		if (!SPEEDS.includes(value)) return;
		this.speed = value;
		remember("vfc-speed", value);
		this.#applySound();
	};

	length = (k: number) => this.#lengths[k];

	go = (k: number, play = true) => {
		for (const a of this.#audios) {
			a.pause();
			a.currentTime = 0;
		}
		this.idx = clamp(k, 0, this.count - 1);
		this.t = 0;
		this.#audioOn = false;
		this.running = play;
	};

	jump = (k: number) => {
		this.started = true;
		this.go(k);
	};

	/**
	 * Moves to `t` seconds into the current scene (a word or a point on the
	 * timeline). Keeps playing if it was playing; starts playing if nothing had
	 * started yet. Reveals before `t` switch on and later ones switch off.
	 */
	seek = (t: number) => {
		if (!this.started) {
			this.started = true;
			this.running = true;
		}
		const a = this.#audios[this.idx];
		this.t = clamp(t, 0, this.length(this.idx) - 0.02);
		if (this.t >= LEAD) {
			a.currentTime = this.t - LEAD;
			this.#audioOn = true;
			if (this.running) a.play().catch(() => {});
		} else {
			a.pause();
			a.currentTime = 0;
			this.#audioOn = false;
		}
	};

	/** The current scene has played to its end. */
	get finished() {
		return this.t >= this.length(this.idx) - 0.01;
	}

	/** The whole explainer has played to the end (the last scene is finished). */
	get ended() {
		return (
			this.started &&
			!this.running &&
			this.idx === this.count - 1 &&
			this.finished
		);
	}

	toggle = () => {
		if (!this.started) return this.jump(0);
		if (this.running) {
			this.running = false;
			this.#audios[this.idx].pause();
		} else if (this.finished) {
			// Like any video: at the very end, play starts over from the top;
			// after any other scene, it carries on to the next one.
			this.go(this.idx < this.count - 1 ? this.idx + 1 : 0);
		} else {
			this.running = true;
			if (this.#audioOn) this.#audios[this.idx].play().catch(() => {});
		}
	};

	setAuto = (value: boolean) => {
		this.auto = value;
		remember("vfc-auto", value);
		const done = this.t >= this.length(this.idx) - 0.01;
		if (
			value &&
			this.started &&
			!this.running &&
			done &&
			this.idx < this.count - 1
		)
			this.go(this.idx + 1);
	};

	setCc = (value: boolean) => {
		this.cc = value;
		remember("vfc-cc", value);
	};

	#step(dt: number) {
		const a = this.#audios[this.idx];
		if (!this.#audioOn && this.t >= LEAD) {
			this.#audioOn = true;
			a.currentTime = Math.max(0, this.t - LEAD);
			a.play().catch(() => {});
		}
		this.t =
			this.#audioOn && !a.paused && !a.ended
				? LEAD + a.currentTime
				: this.t + dt * this.speed; // no voice (lead-in, rest): clock at the chosen speed
		if (this.t < this.length(this.idx)) return;
		if (this.auto && this.idx < this.count - 1) this.go(this.idx + 1);
		else {
			this.t = this.length(this.idx);
			this.running = false;
		}
	}

	/** Attachment: runs the clock while the element is on the page. */
	clock = () => {
		let raf = 0;
		let prev = performance.now();
		const frame = (now: number) => {
			if (this.running) this.#step(Math.min(0.1, (now - prev) / 1000));
			prev = now;
			raf = requestAnimationFrame(frame);
		};
		raf = requestAnimationFrame(frame);
		return () => cancelAnimationFrame(raf);
	};
}
