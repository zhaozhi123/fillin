export type FillinElement =
  | HTMLInputElement
  | HTMLTextAreaElement
  | HTMLSelectElement
  | HTMLElement;

const ARTICLE_PAGE_PATTERN =
  /写文章|文章编辑|专栏|创作中心|write.?article|article.?editor|post.?editor/i;
const ARTICLE_EDITOR_STRUCTURE_PATTERN =
  /drafteditor|prosemirror|richtext|rich-text|article.?body|article.?content|post.?body|post.?content|editor.?content|ztext/i;
const TITLE_PATTERN =
  /请输入标题|文章标题|标题|题目|headline|article.?title|post.?title|(?:^|[\s_-])title(?:$|[\s_-])/i;

function normalizeText(value: string | null | undefined): string {
  return (value || "").replace(/\s+/g, " ").trim();
}

function getDirectText(element: Element | null): string {
  if (!element) return "";
  return Array.from(element.childNodes)
    .filter((node) => node.nodeType === Node.TEXT_NODE)
    .map((node) => normalizeText(node.textContent))
    .filter(Boolean)
    .join(" ")
    .trim();
}

function getCandidatePlaceholder(element: Element): string {
  return normalizeText(
    element.getAttribute("data-placeholder") ||
      element.getAttribute("aria-placeholder") ||
      element.getAttribute("placeholder") ||
      element.getAttribute("aria-label") ||
      getDirectText(element) ||
      element.textContent
  );
}

function getNearbyEditorPlaceholder(element: FillinElement): string {
  let container = element.parentElement;

  for (let depth = 0; container && depth < 4; depth += 1) {
    const editableCount = container.querySelectorAll(
      'textarea, [contenteditable]:not([contenteditable="false"]), [role="textbox"]'
    ).length;
    if (editableCount > 1) break;

    const candidates = Array.from(
      container.querySelectorAll<HTMLElement>(
        '[data-placeholder], [aria-placeholder], [class*="placeholder" i]'
      )
    );
    for (const candidate of candidates) {
      if (candidate === element) continue;
      const text = getCandidatePlaceholder(candidate);
      if (text && text.length <= 160) return text;
    }

    container = container.parentElement;
  }

  return "";
}

function getElementStructureText(element: FillinElement): string {
  const parts: string[] = [];
  let current: Element | null = element;

  for (let depth = 0; current && depth < 5; depth += 1) {
    parts.push(
      current.tagName,
      current.id,
      String(current.className || ""),
      current.getAttribute("role") || "",
      current.getAttribute("data-testid") || "",
      current.getAttribute("data-contents") || "",
      current.getAttribute("data-editor") || ""
    );
    current = current.parentElement;
  }

  return parts.filter(Boolean).join(" ");
}

function isArticleEditorPage(): boolean {
  const hostAndPath = `${window.location.hostname} ${window.location.pathname}`;
  if (
    /zhuanlan\.zhihu\.com/i.test(window.location.hostname) &&
    /\/(?:write|p\/[^/]+\/edit)/i.test(window.location.pathname)
  ) {
    return true;
  }

  return ARTICLE_PAGE_PATTERN.test(
    `${hostAndPath} ${document.title} ${
      document.querySelector("h1")?.textContent || ""
    }`
  );
}

function getSemanticFallbackLabel(element: FillinElement): string {
  const structure = getElementStructureText(element);
  if (TITLE_PATTERN.test(structure)) return "文章标题";

  const supportsLongText =
    element instanceof HTMLTextAreaElement || element.isContentEditable;
  if (
    supportsLongText &&
    !TITLE_PATTERN.test(
      `${structure} ${getElementPlaceholder(element)}`
    ) &&
    (ARTICLE_EDITOR_STRUCTURE_PATTERN.test(structure) ||
      (element.isContentEditable && isArticleEditorPage()))
  ) {
    return "文章正文";
  }

  return "";
}

export function getElementPlaceholder(element: FillinElement): string {
  return normalizeText(
    element.getAttribute("data-placeholder") ||
      element.getAttribute("aria-placeholder") ||
      element.getAttribute("placeholder") ||
      getNearbyEditorPlaceholder(element)
  );
}

export function getLabel(element: FillinElement): string {
  const ariaLabel = normalizeText(element.getAttribute("aria-label"));
  if (ariaLabel) return ariaLabel;

  const labelledBy = element.getAttribute("aria-labelledby");
  if (labelledBy) {
    const text = labelledBy
      .split(/\s+/)
      .map((id) => normalizeText(document.getElementById(id)?.textContent))
      .filter(Boolean)
      .join(" ");
    if (text) return text;
  }

  if (element.id) {
    const explicit = Array.from(document.querySelectorAll("label")).find(
      (label) => label.htmlFor === element.id
    );
    const explicitText = normalizeText(explicit?.textContent);
    if (explicitText) return explicitText;
  }

  const wrappingLabel = element.closest("label");
  const wrappingText = normalizeText(wrappingLabel?.textContent);
  if (wrappingText) return wrappingText;

  const editorPlaceholder = normalizeText(
    element.getAttribute("title") || getElementPlaceholder(element)
  );
  if (editorPlaceholder) return editorPlaceholder;

  const semanticLabel = getSemanticFallbackLabel(element);
  if (semanticLabel) return semanticLabel;

  const previousText =
    getDirectText(element.previousElementSibling) ||
    normalizeText(element.previousElementSibling?.textContent);
  if (previousText) return previousText;

  const parentText = getDirectText(element.parentElement);
  if (parentText) return parentText;

  const input = element as HTMLInputElement;
  return (
    normalizeText(input.name?.replace(/[_-]+/g, " ")) ||
    normalizeText(element.getAttribute("data-label")) ||
    "未命名字段"
  );
}

export function getDescribedText(element: FillinElement): string {
  const describedBy = element.getAttribute("aria-describedby");
  if (!describedBy) return "";
  return describedBy
    .split(/\s+/)
    .map((id) => normalizeText(document.getElementById(id)?.textContent))
    .filter(Boolean)
    .join(" ");
}

export function getVisibleLines(element: FillinElement): number {
  if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement) {
    return 1;
  }
  if (element instanceof HTMLTextAreaElement && element.rows > 0) {
    return element.rows;
  }
  const style = window.getComputedStyle(element);
  const lineHeight = Number.parseFloat(style.lineHeight);
  const fontSize = Number.parseFloat(style.fontSize) || 16;
  const effectiveLineHeight =
    Number.isFinite(lineHeight) && lineHeight > 0 ? lineHeight : fontSize * 1.5;
  const rectHeight = element.getBoundingClientRect().height;
  const minHeight = Number.parseFloat(style.minHeight) || 0;
  return Math.max(
    1,
    Math.min(80, Math.round(Math.max(rectHeight, minHeight) / effectiveLineHeight))
  );
}

export function getSemanticFieldName(
  element: FillinElement,
  label: string
): string {
  const structure = getElementStructureText(element);
  if (TITLE_PATTERN.test(`${label} ${structure}`)) return "article_title";
  if (label === "文章正文") return "article_body";
  return "";
}

export function getFieldContext(element: FillinElement): string {
  const contextRoot = element.closest(
    'form, fieldset, article, section, [role="form"], [role="dialog"]'
  );
  const heading = contextRoot?.querySelector<HTMLElement>(
    'legend, h1, h2, h3, h4, [role="heading"]'
  );
  const pageHeading = document.querySelector<HTMLElement>("h1");
  const metaDescription = document
    .querySelector<HTMLMetaElement>('meta[name="description"]')
    ?.content?.trim();
  const semanticLabel = getSemanticFallbackLabel(element);

  return [
    getDescribedText(element),
    semanticLabel,
    contextRoot?.getAttribute("aria-label")?.trim(),
    heading?.textContent?.trim(),
    pageHeading?.textContent?.trim(),
    metaDescription
  ]
    .filter((value): value is string => Boolean(value))
    .filter((value, index, values) => values.indexOf(value) === index)
    .join(" · ")
    .replace(/\s+/g, " ")
    .slice(0, 800);
}
