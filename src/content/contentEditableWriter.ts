const EDITOR_SETTLE_DELAY_MS = 36;
const FINAL_SETTLE_DELAY_MS = 320;
const PRIMARY_CHUNK_SIZE = 180;
const RETRY_CHUNK_SIZE = 72;
const MIN_ACCEPTED_RATIO = 0.96;
const MAX_ACCEPTED_RATIO = 1.04;

function waitForAnimationFrame(): Promise<void> {
  return new Promise((resolve) => window.requestAnimationFrame(() => resolve()));
}

async function waitForEditorTurn(delay = EDITOR_SETTLE_DELAY_MS): Promise<void> {
  await waitForAnimationFrame();
  await waitForAnimationFrame();
  await new Promise((resolve) => window.setTimeout(resolve, delay));
}

function normalizeComparableText(value: string): string {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/[\u200b-\u200d\u2060\ufeff]/g, "")
    .replace(/\s+/g, "");
}

export function getContentEditableText(element: HTMLElement): string {
  return (element.innerText || element.textContent || "").trim();
}

export function getContentEditableLength(element: HTMLElement): number {
  return normalizeComparableText(getContentEditableText(element)).length;
}

function getAcceptedLengthRange(value: string): [number, number] {
  const expectedLength = normalizeComparableText(value).length;
  return [
    Math.floor(expectedLength * MIN_ACCEPTED_RATIO),
    Math.ceil(expectedLength * MAX_ACCEPTED_RATIO)
  ];
}

export function getHostReportedEditorLength(): number | undefined {
  if (
    !/zhuanlan\.zhihu\.com/i.test(window.location.hostname) ||
    !/\/(?:write|p\/[^/]+\/edit)/i.test(window.location.pathname)
  ) {
    return undefined;
  }

  const match = document.body.innerText.match(
    /(?:^|\n)字数\s*[:：]\s*(\d+)(?:\n|$)/
  );
  return match?.[1] ? Number(match[1]) : undefined;
}

export function isContentEditableValueApplied(
  element: HTMLElement,
  value: string
): boolean {
  const expected = normalizeComparableText(value);
  const actual = normalizeComparableText(getContentEditableText(element));
  const hostReportedLength = getHostReportedEditorLength();
  if (!expected) {
    return !actual && (hostReportedLength === undefined || hostReportedLength === 0);
  }

  const [minimumAcceptedLength, maximumAcceptedLength] =
    getAcceptedLengthRange(value);
  const edgeLength = Math.min(48, Math.floor(expected.length / 3));
  const hasExpectedEdges =
    edgeLength === 0 ||
    (actual.startsWith(expected.slice(0, edgeLength)) &&
      actual.endsWith(expected.slice(-edgeLength)));

  const hostAccepted =
    hostReportedLength === undefined ||
    (hostReportedLength >= minimumAcceptedLength &&
      hostReportedLength <= maximumAcceptedLength);

  return (
    actual.length >= minimumAcceptedLength &&
    actual.length <= maximumAcceptedLength &&
    hasExpectedEdges &&
    hostAccepted
  );
}

function selectEditorContents(element: HTMLElement): void {
  element.focus();
  if (document.execCommand("selectAll", false)) return;

  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(element);
  selection?.removeAllRanges();
  selection?.addRange(range);
}

async function syncControlledEditorSelection(
  element: HTMLElement
): Promise<void> {
  element.focus();
  await waitForEditorTurn();
  selectEditorContents(element);
  document.dispatchEvent(new Event("selectionchange", { bubbles: true }));
  element.dispatchEvent(new Event("select", { bubbles: true }));
  element.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
  await waitForEditorTurn(120);
}

function placeCursorAtEditorEnd(element: HTMLElement): void {
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  selection?.removeAllRanges();
  selection?.addRange(range);
}

function insertTextFallback(element: HTMLElement, text: string): void {
  placeCursorAtEditorEnd(element);
  const selection = window.getSelection();
  const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
  if (!range) return;
  const textNode = document.createTextNode(text);
  range.insertNode(textNode);
  range.setStartAfter(textNode);
  range.collapse(true);
  selection?.removeAllRanges();
  selection?.addRange(range);
  element.dispatchEvent(
    new InputEvent("input", {
      bubbles: true,
      inputType: "insertText",
      data: text
    })
  );
}

async function clearEditor(element: HTMLElement): Promise<void> {
  element.focus();
  selectEditorContents(element);
  document.execCommand("delete", false);
  await waitForEditorTurn();

  if (getContentEditableLength(element) > 0) {
    selectEditorContents(element);
    const replaced = document.execCommand("insertText", false, "");
    if (!replaced) {
      element.textContent = "";
      element.dispatchEvent(
        new InputEvent("input", {
          bubbles: true,
          inputType: "deleteContentBackward",
          data: null
        })
      );
    }
    await waitForEditorTurn();
  }
}

function splitIntoChunks(value: string, maximum: number): string[] {
  const chunks: string[] = [];
  let remainder = value;

  while (remainder.length > maximum) {
    const searchWindow = remainder.slice(0, maximum + 1);
    const boundary = Math.max(
      searchWindow.lastIndexOf("。"),
      searchWindow.lastIndexOf("！"),
      searchWindow.lastIndexOf("？"),
      searchWindow.lastIndexOf("；"),
      searchWindow.lastIndexOf("，"),
      searchWindow.lastIndexOf(" ")
    );
    const splitAt = boundary >= Math.floor(maximum * 0.45)
      ? boundary + 1
      : maximum;
    chunks.push(remainder.slice(0, splitAt));
    remainder = remainder.slice(splitAt);
  }

  if (remainder) chunks.push(remainder);
  return chunks;
}

async function insertTextChunk(
  element: HTMLElement,
  chunk: string
): Promise<void> {
  const beforeLength = getContentEditableLength(element);
  placeCursorAtEditorEnd(element);
  const inserted = document.execCommand("insertText", false, chunk);
  if (!inserted) insertTextFallback(element, chunk);
  await waitForEditorTurn();

  const expectedGrowth = normalizeComparableText(chunk).length;
  if (
    expectedGrowth > 0 &&
    getContentEditableLength(element) <
      beforeLength + Math.floor(expectedGrowth * 0.8)
  ) {
    placeCursorAtEditorEnd(element);
    const retried = document.execCommand("insertText", false, chunk);
    if (!retried) insertTextFallback(element, chunk);
    await waitForEditorTurn(EDITOR_SETTLE_DELAY_MS * 2);
  }
}

async function insertParagraph(element: HTMLElement): Promise<void> {
  placeCursorAtEditorEnd(element);
  const inserted = document.execCommand("insertParagraph", false);
  if (!inserted) {
    insertTextFallback(element, "\n");
  }
  await waitForEditorTurn();
}

async function writeAttempt(
  element: HTMLElement,
  value: string,
  chunkSize: number
): Promise<void> {
  await clearEditor(element);
  const lines = value.replace(/\r\n?/g, "\n").split("\n");

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    if (lineIndex > 0) await insertParagraph(element);
    const line = lines[lineIndex] || "";
    for (const chunk of splitIntoChunks(line, chunkSize)) {
      await insertTextChunk(element, chunk);
    }
  }

  element.dispatchEvent(new Event("change", { bubbles: true }));
  element.blur();
  await waitForEditorTurn(FINAL_SETTLE_DELAY_MS);
}

async function waitForAppliedValue(
  element: HTMLElement,
  value: string,
  timeoutMs: number
): Promise<boolean> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (isContentEditableValueApplied(element, value)) return true;
    await new Promise((resolve) => window.setTimeout(resolve, 120));
  }
  return isContentEditableValueApplied(element, value);
}

async function tryPasteThroughEditor(
  element: HTMLElement,
  value: string
): Promise<"unsupported" | "handled"> {
  if (!value || typeof DataTransfer === "undefined") return "unsupported";

  await syncControlledEditorSelection(element);
  const clipboardData = new DataTransfer();
  clipboardData.setData("text/plain", value);
  const event = new ClipboardEvent("paste", {
    bubbles: true,
    cancelable: true,
    clipboardData
  });
  const handled = !element.dispatchEvent(event);
  if (!handled) return "unsupported";

  element.dispatchEvent(new Event("change", { bubbles: true }));
  element.blur();
  await waitForEditorTurn(FINAL_SETTLE_DELAY_MS);
  await waitForAppliedValue(element, value, 5000);

  const hostReportedLength = getHostReportedEditorLength();
  const [, maximumAcceptedLength] = getAcceptedLengthRange(value);
  if (
    hostReportedLength !== undefined &&
    hostReportedLength > maximumAcceptedLength
  ) {
    element.focus();
    document.execCommand("undo", false);
    element.blur();
    await waitForEditorTurn(FINAL_SETTLE_DELAY_MS);
  }

  return "handled";
}

export async function writeContentEditableValue(
  element: HTMLElement,
  value: string
): Promise<void> {
  const pasteResult = await tryPasteThroughEditor(element, value);
  if (pasteResult === "handled") return;

  await writeAttempt(element, value, PRIMARY_CHUNK_SIZE);
  if (await waitForAppliedValue(element, value, 2200)) return;

  await writeAttempt(element, value, RETRY_CHUNK_SIZE);
  await waitForAppliedValue(element, value, 2200);
}
