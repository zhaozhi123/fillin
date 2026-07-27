import type {
  FieldDescriptor,
  FillSuggestion,
  LengthGuidance
} from "../shared/types";
import {
  buildLocalizedArticle,
  getLocalizedArticleTopic
} from "./articleLocale";
import type { SupportedPageLanguage } from "./pageLanguage";

export const LONG_ARTICLE_MIN_LENGTH = 3500;
export const LONG_ARTICLE_TARGET_LENGTH = 5000;
export const LONG_ARTICLE_MAX_LENGTH = 7000;

const ARTICLE_CONTEXT_PATTERN =
  /正文|文章内容|长文|博文|专栏|写文章|创作|article.?body|post.?body|post.?content|long.?form|rich.?text.?editor|artikelinhalt|beitragsinhalt|artikel.?schreiben|beitrag.?schreiben|texteditor/i;
const EXPLICIT_ARTICLE_BODY_PATTERN =
  /正文|文章内容|长文正文|article.?body|post.?body|post.?content|editor.?content|artikelinhalt|beitragsinhalt|haupttext/i;
const ARTICLE_TITLE_PATTERN =
  /请输入标题|文章标题|标题|题目|headline|article.?title|post.?title|(?:^|[\s_-])title(?:$|[\s_-])|überschrift|artikel.?titel|beitrags.?titel|titel.?eingeben/i;
const ARTICLE_TITLE_SEMANTIC_PATTERN =
  /article.?title|post.?title|headline|title|überschrift|titel/i;
const SHORT_CONTENT_PATTERN =
  /摘要|简介|简述|说明|评论|回复|留言|bio|summary|description|comment|reply|message|zusammenfassung|beschreibung|kommentar|antwort|nachricht/i;

function getFieldOwnText(field: FieldDescriptor): string {
  return [
    field.label,
    field.name,
    field.placeholder
  ]
    .filter(Boolean)
    .join(" ");
}

export function isArticleBodyField(
  field: FieldDescriptor,
  suggestion?: FillSuggestion
): boolean {
  if (field.kind !== "textarea" && field.kind !== "contenteditable") {
    return false;
  }

  const ownText = getFieldOwnText(field);
  if (ARTICLE_TITLE_PATTERN.test(ownText)) {
    return false;
  }
  if (SHORT_CONTENT_PATTERN.test(ownText)) {
    return false;
  }
  if (EXPLICIT_ARTICLE_BODY_PATTERN.test(ownText)) {
    return true;
  }
  if (ARTICLE_TITLE_SEMANTIC_PATTERN.test(suggestion?.semanticType || "")) {
    return false;
  }

  const context = `${ownText} ${field.context || ""}`;
  const hasArticleContext = ARTICLE_CONTEXT_PATTERN.test(context);
  if (SHORT_CONTENT_PATTERN.test(context) && !hasArticleContext) {
    return false;
  }

  return (
    hasArticleContext ||
    suggestion?.semanticType === "long_form" ||
    (field.kind === "contenteditable" && (field.visibleLines || 0) >= 16)
  );
}

export function isArticleTitleField(
  field: FieldDescriptor,
  suggestion?: FillSuggestion
): boolean {
  const ownText = getFieldOwnText(field);
  if (ARTICLE_TITLE_PATTERN.test(ownText)) return true;
  if (EXPLICIT_ARTICLE_BODY_PATTERN.test(ownText)) return false;
  return ARTICLE_TITLE_SEMANTIC_PATTERN.test(suggestion?.semanticType || "");
}

export function getArticleTitleLengthGuidance(
  field: FieldDescriptor
): LengthGuidance {
  const maximum = Math.max(
    1,
    Math.min(
      field.maxLength && field.maxLength > 0 ? field.maxLength : 42,
      42
    )
  );
  const minimum = Math.min(maximum, 8);
  const target = Math.max(minimum, Math.min(maximum, 28));

  return {
    min: minimum,
    target,
    max: maximum,
    unit: "characters"
  };
}

export function getLongArticleLengthGuidance(
  field: FieldDescriptor
): LengthGuidance {
  const maximum = Math.max(
    1,
    Math.min(
      field.maxLength && field.maxLength > 0
        ? field.maxLength
        : LONG_ARTICLE_MAX_LENGTH,
      LONG_ARTICLE_MAX_LENGTH
    )
  );
  const minimum =
    maximum >= LONG_ARTICLE_MIN_LENGTH
      ? LONG_ARTICLE_MIN_LENGTH
      : Math.max(1, Math.floor(maximum * 0.75));
  const target = Math.max(
    minimum,
    Math.min(maximum, LONG_ARTICLE_TARGET_LENGTH)
  );

  return {
    min: minimum,
    target,
    max: maximum,
    unit: "characters"
  };
}

export function buildLongArticleFallback({
  field,
  instruction,
  seed = "",
  language = "zh"
}: {
  field: FieldDescriptor;
  instruction: string;
  seed?: string;
  language?: SupportedPageLanguage;
}): string {
  const guidance = getLongArticleLengthGuidance(field);
  return buildLocalizedArticle({
    language,
    topic: getLocalizedArticleTopic(language, instruction),
    targetLength: guidance.target,
    seed
  });
}
