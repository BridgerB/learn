// Getting the /learn skill onto the reader's machine, straight from the page.

/** Where Claude Code looks for a personal skill (all projects). */
export const SKILL_DIR = "~/.claude/skills/learn";

/**
 * One terminal command that creates the skill folder and writes SKILL.md into
 * it. The file travels inside the command (a quoted heredoc, so `$ARGUMENTS`
 * stays literal), so it works offline and needs nothing published.
 */
export function installCommand(skill: string) {
	const body = skill.endsWith("\n") ? skill : `${skill}\n`;
	return `mkdir -p ${SKILL_DIR} && cat > ${SKILL_DIR}/SKILL.md <<'SKILL'\n${body}SKILL\n`;
}

/** Saves SKILL.md to the reader's downloads folder. */
export function downloadSkill(skill: string) {
	const url = URL.createObjectURL(new Blob([skill], { type: "text/markdown" }));
	const a = document.createElement("a");
	a.href = url;
	a.download = "SKILL.md";
	document.body.append(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Copies text to the clipboard; falls back to a hidden textarea where the Clipboard API is blocked. */
export async function copyText(text: string) {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		const ta = document.createElement("textarea");
		ta.value = text;
		ta.setAttribute("readonly", "");
		ta.style.position = "fixed";
		ta.style.opacity = "0";
		document.body.append(ta);
		ta.select();
		const ok = document.execCommand("copy");
		ta.remove();
		return ok;
	}
}
