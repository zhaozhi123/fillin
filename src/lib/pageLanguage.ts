export type SupportedPageLanguage = "zh" | "en" | "de";

const GERMAN_WORDS =
  /\b(?:der|die|das|den|dem|des|ein|eine|einer|einem|einen|und|oder|aber|nicht|ist|sind|mit|für|auf|von|zu|im|wir|sie|diese|dieser|werden|wie|was|warum|auch|bei|aus|durch|über|kann|können|mehr)\b/gi;
const ENGLISH_WORDS =
  /\b(?:the|a|an|and|or|but|not|is|are|with|for|on|from|to|in|we|you|this|that|these|will|can)\b/gi;

function declaredLanguage(value: string): SupportedPageLanguage | undefined {
  const normalized = value.trim().toLowerCase();
  if (/^(?:zh|cmn)(?:-|$)/.test(normalized)) return "zh";
  if (/^de(?:-|$)/.test(normalized)) return "de";
  if (/^en(?:-|$)/.test(normalized)) return "en";
  return undefined;
}

function countMatches(value: string, pattern: RegExp) {
  return value.match(pattern)?.length || 0;
}

export function detectPageLanguage({
  declared = "",
  text = ""
}: {
  declared?: string;
  text?: string;
}): SupportedPageLanguage {
  const sample = text.replace(/\s+/g, " ").slice(0, 8000);
  const meaningfulCharacters = sample.replace(/[\d\W_]/gu, "").length;
  const chineseCharacters = countMatches(sample, /[\u3400-\u9fff]/g);
  if (
    chineseCharacters >= 12 &&
    chineseCharacters / Math.max(1, meaningfulCharacters) >= 0.08
  ) {
    return "zh";
  }

  const germanScore =
    countMatches(sample, GERMAN_WORDS) * 2 +
    countMatches(sample, /[äöüßÄÖÜ]/g) * 3;
  const englishScore = countMatches(sample, ENGLISH_WORDS) * 2;
  if (germanScore >= 8 && germanScore > englishScore * 0.8) return "de";
  if (englishScore >= 8 && englishScore > germanScore) return "en";

  return declaredLanguage(declared) || "en";
}

export function languageMatchesText(
  language: SupportedPageLanguage,
  value: string
) {
  const normalized = value.trim();
  if (!normalized) return false;
  const chineseCharacters = countMatches(normalized, /[\u3400-\u9fff]/g);
  if (language === "zh") return chineseCharacters >= 2;
  if (chineseCharacters >= 2) return false;
  if (language === "de") {
    return (
      countMatches(normalized, /[äöüßÄÖÜ]/g) > 0 ||
      countMatches(normalized, GERMAN_WORDS) > 0
    );
  }
  if (
    countMatches(normalized, /[A-Za-z]/g) >= 3 &&
    countMatches(normalized, GERMAN_WORDS) === 0 &&
    countMatches(normalized, /[äöüßÄÖÜ]/g) === 0
  ) {
    return true;
  }
  return detectPageLanguage({ text: value }) === language;
}
