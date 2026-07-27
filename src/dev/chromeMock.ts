import type { FieldDescriptor } from "../shared/types";

const demoFields: FieldDescriptor[] = [
  {
    id: "demo-name",
    kind: "text",
    label: "姓名",
    name: "full_name",
    placeholder: "请输入姓名",
    required: true,
    options: [],
    currentValue: ""
  },
  {
    id: "demo-email",
    kind: "email",
    label: "工作邮箱",
    name: "email",
    placeholder: "name@company.com",
    required: true,
    options: [],
    currentValue: ""
  },
  {
    id: "demo-password",
    kind: "password",
    label: "密码",
    name: "password",
    placeholder: "请输入密码",
    required: true,
    options: [],
    currentValue: "",
    minLength: 12
  },
  {
    id: "demo-phone",
    kind: "tel",
    label: "联系电话",
    name: "phone",
    placeholder: "",
    required: false,
    options: [],
    currentValue: ""
  },
  {
    id: "demo-role",
    kind: "text",
    label: "当前职位",
    name: "role",
    placeholder: "",
    required: true,
    options: [],
    currentValue: ""
  },
  {
    id: "demo-city",
    kind: "select",
    label: "所在城市",
    name: "city",
    placeholder: "",
    required: true,
    options: ["shanghai: 上海", "beijing: 北京", "shenzhen: 深圳"],
    currentValue: ""
  },
  {
    id: "demo-intro",
    kind: "textarea",
    label: "个人简介",
    name: "bio",
    placeholder: "简单介绍一下自己",
    required: false,
    options: [],
    currentValue: ""
  }
];

const editorFields: FieldDescriptor[] = [
  {
    id: "editor-title",
    kind: "textarea",
    label: "请输入标题（最多 100 个字）",
    name: "title",
    placeholder: "请输入标题",
    required: true,
    options: [],
    currentValue: "",
    maxLength: 100,
    visibleLines: 1,
    context: "知乎专栏文章编辑器 · 写文章"
  },
  {
    id: "editor-body",
    kind: "contenteditable",
    label: "请输入正文",
    name: "content",
    placeholder: "请输入正文",
    required: true,
    options: [],
    currentValue: "",
    visibleLines: 38,
    context: "知乎专栏文章编辑器 · 长文正文区域"
  },
  {
    id: "editor-language",
    kind: "select",
    label: "选择语言",
    name: "language",
    placeholder: "",
    required: false,
    options: ["zh: 中文", "en: English"],
    currentValue: "zh",
    visibleLines: 1,
    context: "编辑器语言偏好"
  }
];

const existingEditorFields: FieldDescriptor[] = editorFields.map((field) => {
  if (field.id === "editor-title") {
    return {
      ...field,
      currentValue: "AI 填写表单：让智能助手帮你高效完成在线表"
    };
  }
  if (field.id === "editor-body") {
    return {
      ...field,
      currentValue:
        "在现代互联网中，填写各类在线表单已成为日常工作和生活的一部分。本文将介绍 AI 表单填充的原理。"
    };
  }
  return { ...field, currentValue: "" };
});

export function installChromeMock() {
  if (!import.meta.env.DEV) return;
  const availableChrome = (
    globalThis as unknown as {
      chrome?: {
        tabs?: { query?: unknown };
        storage?: { local?: unknown };
      };
    }
  ).chrome;
  if (
    typeof availableChrome?.tabs?.query === "function" &&
    availableChrome.storage?.local
  ) {
    return;
  }

  const scenario = new URLSearchParams(window.location.search).get("demo");
  const isEditorDemo = scenario === "editor" || scenario === "editor-existing";
  const isExistingEditorDemo = scenario === "editor-existing";
  const localStore: Record<string, unknown> = isEditorDemo
    ? {
        "fillin.aiConfig": {
          baseUrl: "https://mock.fillin.local/v1",
          apiKey: "demo-key",
          model: "fillin-demo",
          profile: "",
          dataSharingConsent: true
        }
      }
    : {};
  const noopEvent = {
    addListener: () => {},
    removeListener: () => {},
    hasListener: () => false
  };

  const mockChrome = {
    tabs: {
      query: async () => [
        {
          id: 1,
          active: true,
          title: isEditorDemo ? "写文章 - 知乎" : "申请产品体验",
          url: isEditorDemo
            ? "https://zhuanlan.zhihu.com/write"
            : "https://example.com/application",
          favIconUrl: ""
        }
      ],
      sendMessage: async (_tabId: number, request: { type?: string }) => {
        if (request.type === "FILLIN_SCAN") {
          return {
            fields: isExistingEditorDemo
              ? existingEditorFields
              : isEditorDemo
                ? editorFields
                : demoFields
          };
        }
        return { ok: true };
      },
      onActivated: noopEvent,
      onUpdated: noopEvent
    },
    scripting: {
      executeScript: async () => []
    },
    storage: {
      local: {
        get: async (key: string) => ({ [key]: localStore[key] }),
        set: async (values: Record<string, unknown>) => {
          Object.assign(localStore, values);
        }
      }
    },
    runtime: {
      getManifest: () => ({
        content_scripts: [{ js: ["src/content/index.ts"] }]
      })
    }
  };

  const existingChrome =
    (availableChrome as unknown as Record<string, unknown> | undefined) || {};
  Object.assign(existingChrome, mockChrome);
  (globalThis as unknown as { chrome: typeof chrome }).chrome =
    existingChrome as unknown as typeof chrome;

  if (isEditorDemo) {
    const nativeFetch = globalThis.fetch.bind(globalThis);
    globalThis.fetch = async (input, init) => {
      if (String(input).startsWith("https://mock.fillin.local")) {
        const request = JSON.parse(String(init?.body || "{}")) as {
          messages?: Array<{ role?: string; content?: string }>;
        };
        const userPayload = JSON.parse(
          request.messages?.find((message) => message.role === "user")?.content ||
            "{}"
        ) as { taskInstruction?: string; shortDecisions?: unknown[] };
        const hasInstruction =
          userPayload.taskInstruction &&
          !userPayload.taskInstruction.startsWith("No task-specific");
        const isLengthCorrection = Array.isArray(userPayload.shortDecisions);
        const expandedBody = Array.from(
          { length: 8 },
          (_, index) =>
            `第 ${index + 1} 部分聚焦于 AI 表单填写的实际价值。系统不仅要读取输入框类型，还需要结合页面用途、字段标签、上下文说明和现有内容判断业务含义。在此基础上，Fillin 会为标题、摘要、个人简介或长文正文选择不同的内容长度，并把识别、生成和写入过程完整展示给用户。`
        ).join("\n\n");
        const decisions = [
          {
            fieldId: "editor-title",
            businessMeaning: "知乎文章标题",
            semanticType: "article_title",
            lengthGuidance: {
              min: 18,
              target: 28,
              max: 40,
              unit: "characters"
            },
            value:
              hasInstruction && !isExistingEditorDemo
                ? "让 AI 真正理解表单：Fillin 的产品设计"
                : "",
            action:
              hasInstruction && !isExistingEditorDemo ? "fill" : "skip",
            confidence: "high"
          },
          {
            fieldId: "editor-body",
            businessMeaning: "知乎长文正文",
            semanticType: "long_form",
            lengthGuidance: {
              min: 700,
              target: 1000,
              max: 1400,
              unit: "characters"
            },
            value: hasInstruction
              ? isLengthCorrection
                ? expandedBody
                : "填写表单看似简单，真正困难的是理解上下文。Fillin 通过识别字段、匹配用户资料，并逐项展示填写过程，让自动化保持可见、可控。文章将从字段识别、内容生成、隐私安全和用户确认四个角度展开，说明 AI 如何在减少重复劳动的同时，把最终决定权留给用户。"
              : "",
            action: hasInstruction
              ? isExistingEditorDemo
                ? "replace"
                : "fill"
              : "skip",
            confidence: "high"
          },
          {
            fieldId: "editor-language",
            businessMeaning: "编辑器语言偏好",
            semanticType: "option",
            value: "",
            action: "skip",
            confidence: "high"
          }
        ];
        return new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({ decisions })
                }
              }
            ]
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
      return nativeFetch(input, init);
    };
  }
}
