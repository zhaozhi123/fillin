type MessageListener = (
  request: Record<string, unknown>,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void
) => boolean | void;

let listener: MessageListener | undefined;

(globalThis as unknown as { chrome: Partial<typeof chrome> }).chrome = {
  runtime: {
    onMessage: {
      addListener: (nextListener: MessageListener) => {
        listener = nextListener;
      }
    }
  } as unknown as typeof chrome.runtime
};

const draftLikeEditor = document.getElementById("article-body");
draftLikeEditor?.addEventListener("paste", (event) => {
  const clipboardEvent = event as ClipboardEvent;
  const text = clipboardEvent.clipboardData?.getData("text/plain") || "";
  if (!text) return;
  event.preventDefault();
  draftLikeEditor.innerText = text;
  draftLikeEditor.dataset.pasteHandled = "true";
  draftLikeEditor.dispatchEvent(
    new InputEvent("input", {
      bubbles: true,
      inputType: "insertFromPaste",
      data: text
    })
  );
});

await import("../content/index");

function sendMessage<T>(request: Record<string, unknown>) {
  return new Promise<T>((resolve, reject) => {
    if (!listener) {
      reject(new Error("Content listener was not registered"));
      return;
    }
    listener(request, {} as chrome.runtime.MessageSender, (response) =>
      resolve(response as T)
    );
  });
}

const scan = await sendMessage<{
  fields: Array<{
    id: string;
    label: string;
    kind: string;
    maxLength?: number;
    visibleLines?: number;
    context?: string;
  }>;
}>({ type: "FILLIN_SCAN" });
const richTextField = scan.fields.find(
  (field) => field.kind === "contenteditable"
);

if (!richTextField) {
  throw new Error("Rich text field was not detected");
}

await sendMessage({
  type: "FILLIN_FILL_FIELD",
  fieldId: richTextField.id,
  value: Array.from(
    { length: 36 },
    (_, index) =>
      `第 ${index + 1} 段用于验证长篇富文本写入。Fillin 必须等待受控编辑器完成每次状态更新，再继续写入下一段，不能只检查字段是否非空。`
  ).join("\n\n")
});

const editorValue =
  document.getElementById("article-body")?.innerText.trim() || "";
const expectedLength = Array.from(
  { length: 36 },
  (_, index) =>
    `第 ${index + 1} 段用于验证长篇富文本写入。Fillin 必须等待受控编辑器完成每次状态更新，再继续写入下一段，不能只检查字段是否非空。`
).join("\n\n").replace(/\s+/g, "").length;
const actualLength = editorValue.replace(/\s+/g, "").length;
const pasteHandled =
  document.getElementById("article-body")?.dataset.pasteHandled === "true";
const output = document.getElementById("harness-result");
const titleField = scan.fields.find((field) => field.id !== richTextField.id);
if (output) {
  output.textContent = JSON.stringify({
    detectedLabels: scan.fields.map((field) => field.label),
    titleMaxLength: titleField?.maxLength,
    editorVisibleLines: richTextField.visibleLines,
    expectedLength,
    actualLength,
    pasteHandled,
    passed:
      richTextField.label === "请输入正文" &&
      actualLength === expectedLength &&
      pasteHandled &&
      titleField?.maxLength === 80 &&
      Number(richTextField.visibleLines) >= 10
  });
}

export {};
