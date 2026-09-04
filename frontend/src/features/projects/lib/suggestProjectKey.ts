const FALLBACK_KEY = "PROJ";

/** Backend's actual validation (projectService.ts) — the derivation below only needs
 * to produce a reasonable starting suggestion; the field stays user-editable and is
 * validated against this same pattern before submit either way. */
export const PROJECT_KEY_PATTERN = /^[A-Z][A-Z0-9]{1,9}$/;

/**
 * Suggests a project key from its name: initials for a multi-word name (e.g.
 * "City Desk" -> "CD"), the first few characters for a single word (e.g.
 * "Marketing" -> "MARK"), falling back to a fixed default for anything that
 * can't produce a valid key (no letters/digits, or a lone 1-char word).
 */
export function suggestProjectKey(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/[^a-zA-Z0-9]/g, ""))
    .filter(Boolean);

  const candidate =
    words.length >= 2
      ? words
          .slice(0, 3)
          .map((word) => word[0])
          .join("")
          .toUpperCase()
      : (words[0]?.slice(0, 4) ?? "").toUpperCase();

  return PROJECT_KEY_PATTERN.test(candidate) ? candidate : FALLBACK_KEY;
}
