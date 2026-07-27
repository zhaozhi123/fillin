import type {
  FieldDescriptor,
  PageContext,
  PageObservation,
  ScanResponse
} from "../shared/types";

type FrameField = Pick<FieldDescriptor, "id" | "frameId" | "localId">;
type RestoreValue = FrameField & { value: string };
type FrameBridgeResult = { ok: boolean; error?: string } | null;

const FRAME_FIELD_SEPARATOR = "::";

function isSupportedUrl(url: string) {
  return /^(https?|file):/i.test(url);
}

function scanCurrentFrame(): ScanResponse | null {
  return (
    window as typeof window & {
      __fillinFrameBridge?: { scan: () => ScanResponse };
    }
  ).__fillinFrameBridge?.scan() || null;
}

function observeCurrentFrame(): PageObservation | null {
  return (
    window as typeof window & {
      __fillinFrameBridge?: { observe?: () => PageObservation };
    }
  ).__fillinFrameBridge?.observe?.() || null;
}

function fillCurrentFrame(
  fieldId: string,
  value: string
): Promise<FrameBridgeResult> | FrameBridgeResult {
  const bridge = (
    window as typeof window & {
      __fillinFrameBridge?: {
        fillField: (
          localFieldId: string,
          nextValue: string
        ) => Promise<{ ok: boolean; error?: string }>;
      };
    }
  ).__fillinFrameBridge;
  return bridge?.fillField(fieldId, value) || null;
}

function restoreCurrentFrame(
  values: Array<{ fieldId: string; value: string }>
): Promise<FrameBridgeResult> | FrameBridgeResult {
  const bridge = (
    window as typeof window & {
      __fillinFrameBridge?: {
        restore: (
          nextValues: Array<{ fieldId: string; value: string }>
        ) => Promise<{ ok: boolean; error?: string }>;
      };
    }
  ).__fillinFrameBridge;
  return bridge?.restore(values) || null;
}

function encodeFrameFieldId(frameId: number, localId: string) {
  return `${frameId}${FRAME_FIELD_SEPARATOR}${localId}`;
}

function getFrameId(field: FrameField) {
  return field.frameId ?? 0;
}

function getLocalFieldId(field: FrameField) {
  if (field.localId) return field.localId;
  const separatorIndex = field.id.indexOf(FRAME_FIELD_SEPARATOR);
  return separatorIndex >= 0
    ? field.id.slice(separatorIndex + FRAME_FIELD_SEPARATOR.length)
    : field.id;
}

function getContentScriptPath() {
  const path = chrome.runtime.getManifest().content_scripts?.[0]?.js?.[0];
  if (!path) throw new Error("未找到 Fillin 页面脚本");
  return path;
}

async function injectContentScript(tabId: number, frameIds: number[]) {
  if (!frameIds.length) return;
  await chrome.scripting.executeScript({
    target: { tabId, frameIds },
    files: [getContentScriptPath()]
  });
}

async function scanFrames(tabId: number) {
  return chrome.scripting.executeScript({
    target: { tabId, allFrames: true },
    func: scanCurrentFrame
  });
}

async function observeFrames(tabId: number) {
  return chrome.scripting.executeScript({
    target: { tabId, allFrames: true },
    func: observeCurrentFrame
  });
}

async function ensureFrameBridges(
  tabId: number,
  initialResults: Awaited<ReturnType<typeof scanFrames>>
) {
  const missingFrameIds = initialResults
    .filter((result) => !result.result)
    .map((result) => result.frameId);
  if (!missingFrameIds.length) return initialResults;

  await injectContentScript(tabId, missingFrameIds);
  const refreshedResults = await chrome.scripting.executeScript({
    target: { tabId, frameIds: missingFrameIds },
    func: scanCurrentFrame
  });
  const refreshedByFrame = new Map(
    refreshedResults.map((result) => [result.frameId, result])
  );
  return initialResults.map(
    (result) => refreshedByFrame.get(result.frameId) || result
  );
}

async function executeInFrame<TArgs extends unknown[]>(
  tabId: number,
  frameId: number,
  func: (...args: TArgs) => Promise<FrameBridgeResult> | FrameBridgeResult,
  args: TArgs
) {
  const execute = () =>
    chrome.scripting.executeScript({
      target: { tabId, frameIds: [frameId] },
      func,
      args
    });

  let [result] = await execute();
  if (!result?.result) {
    await injectContentScript(tabId, [frameId]);
    [result] = await execute();
  }
  if (!result?.result) {
    throw new Error("页面中的目标区域暂时无法访问");
  }
  if (!result.result.ok) {
    throw new Error(result.result.error || "页面拒绝了本次填写");
  }
}

export async function getActivePage(): Promise<PageContext> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url) {
    throw new Error("无法读取当前标签页");
  }

  let hostname = "";
  try {
    hostname = new URL(tab.url).hostname || "本地页面";
  } catch {
    hostname = "当前页面";
  }

  return {
    tabId: tab.id,
    title: tab.title || "未命名页面",
    url: tab.url,
    hostname,
    faviconUrl: tab.favIconUrl
  };
}

export async function scanPage(page: PageContext) {
  if (!isSupportedUrl(page.url)) {
    throw new Error("Chrome 内部页面不允许插件读取，请打开一个普通网页");
  }

  const frameResults = await ensureFrameBridges(
    page.tabId,
    await scanFrames(page.tabId)
  );
  return frameResults.flatMap((frameResult) =>
    (frameResult.result?.fields || []).map((field) => ({
      ...field,
      id: encodeFrameFieldId(frameResult.frameId, field.id),
      frameId: frameResult.frameId,
      localId: field.id
    }))
  );
}

export async function observePage(page: PageContext): Promise<PageObservation> {
  if (!isSupportedUrl(page.url)) {
    throw new Error("Chrome 内部页面不允许插件读取，请打开一个普通网页");
  }

  let frameResults = await observeFrames(page.tabId);
  const missingFrameIds = frameResults
    .filter((result) => !result.result)
    .map((result) => result.frameId);
  if (missingFrameIds.length) {
    await injectContentScript(page.tabId, missingFrameIds);
    const refreshed = await chrome.scripting.executeScript({
      target: { tabId: page.tabId, frameIds: missingFrameIds },
      func: observeCurrentFrame
    });
    const refreshedByFrame = new Map(
      refreshed.map((result) => [result.frameId, result])
    );
    frameResults = frameResults.map(
      (result) => refreshedByFrame.get(result.frameId) || result
    );
  }

  const observations = frameResults.flatMap((result) =>
    result.result ? [{ frameId: result.frameId, value: result.result }] : []
  );
  const preferred = observations.sort((left, right) => {
    const score = (entry: (typeof observations)[number]) =>
      (entry.frameId === 0 ? 500 : 0) +
      (entry.value.pageType === "article" ? 1000 : 0) +
      entry.value.mainText.length;
    return score(right) - score(left);
  })[0]?.value;

  return (
    preferred || {
      title: page.title,
      url: page.url,
      language: "",
      pageType: "other",
      heading: page.title,
      description: "",
      mainText: "",
      sectionHeadings: [],
      tags: [],
      sampleComments: []
    }
  );
}

export async function fillPageField(
  page: PageContext,
  field: FrameField,
  value: string
) {
  await executeInFrame(
    page.tabId,
    getFrameId(field),
    fillCurrentFrame,
    [getLocalFieldId(field), value]
  );
}

export async function restorePageFields(
  page: PageContext,
  values: RestoreValue[]
) {
  const valuesByFrame = new Map<
    number,
    Array<{ fieldId: string; value: string }>
  >();
  values.forEach((value) => {
    const frameId = getFrameId(value);
    const frameValues = valuesByFrame.get(frameId) || [];
    frameValues.push({
      fieldId: getLocalFieldId(value),
      value: value.value
    });
    valuesByFrame.set(frameId, frameValues);
  });

  for (const [frameId, frameValues] of valuesByFrame) {
    await executeInFrame(
      page.tabId,
      frameId,
      restoreCurrentFrame,
      [frameValues]
    );
  }
}
