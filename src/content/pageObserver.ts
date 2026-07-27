import type { PageObservation, PageType } from "../shared/types";
import { detectPageLanguage } from "../lib/pageLanguage";

const ARTICLE_TYPES = new Set([
  "Article",
  "BlogPosting",
  "NewsArticle",
  "TechArticle"
]);
const ARTICLE_SELECTORS = [
  '[itemprop="articleBody"]',
  "article",
  '[class*="article-content" i]',
  '[class*="article_content" i]',
  '[class*="article-viewer" i]',
  '[class*="markdown-body" i]',
  '[class*="post-content" i]',
  '[class*="post_content" i]'
];
const COMMENT_SELECTORS = [
  '[class*="comment-content" i]',
  '[class*="comment_content" i]',
  '[class*="comment-item" i] [class*="content" i]',
  '[data-testid*="comment" i]'
];

type ArticleData = {
  headline?: string;
  description?: string;
  articleBody?: string;
  keywords?: string | string[];
};

function normalizeText(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function truncate(value: string | null | undefined, maximum: number) {
  return normalizeText(value).slice(0, maximum);
}

function isArticleData(value: unknown): value is ArticleData {
  if (!value || typeof value !== "object") return false;
  const type = (value as { "@type"?: unknown })["@type"];
  const types = Array.isArray(type) ? type : [type];
  return types.some((item) => ARTICLE_TYPES.has(String(item)));
}

function findArticleData(value: unknown): ArticleData | undefined {
  if (isArticleData(value)) return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const result = findArticleData(item);
      if (result) return result;
    }
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value as Record<string, unknown>)) {
      const result = findArticleData(item);
      if (result) return result;
    }
  }
  return undefined;
}

function getStructuredArticle() {
  for (const script of document.querySelectorAll<HTMLScriptElement>(
    'script[type="application/ld+json"]'
  )) {
    try {
      const article = findArticleData(JSON.parse(script.textContent || ""));
      if (article) return article;
    } catch {
      // Ignore malformed third-party JSON-LD.
    }
  }
  return undefined;
}

function getBestArticleElement() {
  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>(ARTICLE_SELECTORS.join(","))
  );
  return candidates
    .map((element) => ({
      element,
      text: normalizeText(element.innerText || element.textContent)
    }))
    .filter(({ text }) => text.length >= 120)
    .sort((left, right) => right.text.length - left.text.length)[0];
}

function getUniqueTexts(selector: string, maximumItems: number, maximumLength: number) {
  const values = Array.from(document.querySelectorAll<HTMLElement>(selector))
    .map((element) => truncate(element.innerText || element.textContent, maximumLength))
    .filter((value) => value.length >= 2);
  return Array.from(new Set(values)).slice(0, maximumItems);
}

function getTags(article: ArticleData | undefined) {
  const structured = Array.isArray(article?.keywords)
    ? article.keywords
    : String(article?.keywords || "")
        .split(/[,，]/)
        .map((value) => value.trim());
  const visible = getUniqueTexts(
    'a[rel~="tag"], [class*="tag-list" i] a, [class*="article-tag" i]',
    12,
    40
  );
  return Array.from(
    new Set([...structured.map(String).filter(Boolean), ...visible])
  ).slice(0, 12);
}

function inferPageType(articleText: string): PageType {
  const locationText = `${window.location.hostname} ${window.location.pathname}`;
  const editorText = `${locationText} ${document.title}`;
  if (
    /(?:\/edit(?:\/|$)|\/write(?:\/|$)|写文章|创作中心|article.?editor|post.?editor)/i.test(
      editorText
    ) &&
    document.querySelector(
      'textarea, [contenteditable]:not([contenteditable="false"]), [role="textbox"]'
    )
  ) {
    return "article-editor";
  }
  if (articleText.length >= 300) return "article";
  if (document.querySelector("form, [role=form]")) return "form";
  if (/search|搜索/.test(editorText)) return "search";
  return "other";
}

export function observeCurrentPage(): PageObservation {
  const structuredArticle = getStructuredArticle();
  const articleElement = getBestArticleElement();
  const heading = truncate(
    structuredArticle?.headline ||
      document.querySelector<HTMLElement>("h1")?.innerText ||
      document.title,
    240
  );
  const description = truncate(
    structuredArticle?.description ||
      document.querySelector<HTMLMetaElement>('meta[name="description"]')
        ?.content,
    1200
  );
  const articleText = truncate(
    structuredArticle?.articleBody || articleElement?.text || description,
    12000
  );
  const languageSample = truncate(
    articleText ||
      document.querySelector<HTMLElement>("main")?.textContent ||
      document.body?.textContent,
    5000
  );
  const sectionRoot = articleElement?.element || document;
  const structuredSectionSelector = ARTICLE_SELECTORS.map(
    (selector) => `${selector} h2, ${selector} h3`
  ).join(",");
  const structuredSections = getUniqueTexts(
    structuredSectionSelector,
    20,
    120
  );

  return {
    title: truncate(document.title, 240),
    url: window.location.href,
    language: detectPageLanguage({
      declared:
        document.documentElement.lang || navigator.language || "",
      text: `${heading} ${description} ${languageSample}`
    }),
    pageType: inferPageType(articleText),
    heading,
    description,
    mainText: articleText,
    sectionHeadings: structuredSections.length
      ? structuredSections
      : Array.from(sectionRoot.querySelectorAll<HTMLElement>("h2, h3"))
          .map((element) => truncate(element.innerText, 120))
          .filter(Boolean)
          .slice(0, 20),
    tags: getTags(structuredArticle),
    sampleComments: getUniqueTexts(COMMENT_SELECTORS.join(","), 8, 500)
  };
}
