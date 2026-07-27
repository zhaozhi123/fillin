import assert from "node:assert/strict";
import {
  fillPageField,
  restorePageFields,
  scanPage
} from "../src/lib/browser.ts";
import type { FieldDescriptor, PageContext } from "../src/shared/types.ts";

type LocalField = Omit<FieldDescriptor, "frameId" | "localId">;
type Bridge = {
  scan: () => { fields: LocalField[] };
  fillField: (
    fieldId: string,
    value: string
  ) => Promise<{ ok: boolean }>;
  restore: (
    values: Array<{ fieldId: string; value: string }>
  ) => Promise<{ ok: boolean }>;
};
type FrameState = {
  bridge: Bridge | null;
  pendingBridge?: Bridge;
};

const fillCalls: Array<{ frameId: number; fieldId: string; value: string }> = [];
const restoreCalls: Array<{
  frameId: number;
  values: Array<{ fieldId: string; value: string }>;
}> = [];

const makeField = (
  id: string,
  label: string,
  kind: LocalField["kind"] = "text"
): LocalField => ({
  id,
  kind,
  label,
  name: id,
  placeholder: label,
  required: true,
  options: [],
  currentValue: ""
});

const makeBridge = (frameId: number, fields: LocalField[]): Bridge => ({
  scan: () => ({ fields }),
  fillField: async (fieldId, value) => {
    fillCalls.push({ frameId, fieldId, value });
    return { ok: true };
  },
  restore: async (values) => {
    restoreCalls.push({ frameId, values });
    return { ok: true };
  }
});

const frames = new Map<number, FrameState>([
  [0, { bridge: makeBridge(0, []) }],
  [
    7,
    {
      bridge: null,
      pendingBridge: makeBridge(7, [
        makeField("first-name", "First Name"),
        makeField("message", "Message", "textarea")
      ])
    }
  ]
]);

const originalWindow = globalThis.window;

(globalThis as typeof globalThis & { chrome: Partial<typeof chrome> }).chrome = {
  runtime: {
    getManifest: () => ({
      content_scripts: [{ js: ["assets/content.js"], matches: ["<all_urls>"] }]
    })
  } as typeof chrome.runtime,
  scripting: {
    executeScript: async ({
      target,
      files,
      func,
      args
    }: chrome.scripting.ScriptInjection) => {
      const frameIds = target.allFrames
        ? Array.from(frames.keys())
        : target.frameIds || [0];

      if (files) {
        frameIds.forEach((frameId) => {
          const frame = frames.get(frameId);
          if (frame && !frame.bridge) frame.bridge = frame.pendingBridge || null;
        });
        return frameIds.map((frameId) => ({ frameId }));
      }

      const results: chrome.scripting.InjectionResult[] = [];
      for (const frameId of frameIds) {
        const frame = frames.get(frameId);
        globalThis.window = {
          __fillinFrameBridge: frame?.bridge || undefined
        } as unknown as Window & typeof globalThis;
        results.push({
          frameId,
          result: await (
            func as (...nextArgs: unknown[]) => unknown
          )(...((args || []) as unknown[]))
        });
      }
      globalThis.window = originalWindow;
      return results;
    }
  } as typeof chrome.scripting
};

const page: PageContext = {
  tabId: 42,
  title: "SignPath contact",
  url: "https://signpath.io/contact",
  hostname: "signpath.io"
};

const fields = await scanPage(page);
assert.deepEqual(
  fields.map(({ id, frameId, localId, label }) => ({
    id,
    frameId,
    localId,
    label
  })),
  [
    {
      id: "7::first-name",
      frameId: 7,
      localId: "first-name",
      label: "First Name"
    },
    {
      id: "7::message",
      frameId: 7,
      localId: "message",
      label: "Message"
    }
  ]
);

await fillPageField(page, fields[0], "Ada");
assert.deepEqual(fillCalls, [
  { frameId: 7, fieldId: "first-name", value: "Ada" }
]);

await restorePageFields(
  page,
  fields.map((field) => ({ ...field, value: "" }))
);
assert.deepEqual(restoreCalls, [
  {
    frameId: 7,
    values: [
      { fieldId: "first-name", value: "" },
      { fieldId: "message", value: "" }
    ]
  }
]);

console.log("frame routing regression passed");
