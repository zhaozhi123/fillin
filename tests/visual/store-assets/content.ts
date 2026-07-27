import type {
  ProductView,
  ScreenshotAsset,
  ScreenshotStory,
  StoreLocale
} from "./types";

export const BRAND_TAGLINES: Record<StoreLocale, string> = {
  en: "Autofill that understands the page",
  "zh-CN": "懂页面的智能填表助手"
};

export const VIEW_URLS: Record<ProductView, string> = {
  form: "apply.northstar.example/product-demo",
  comment: "journal.novera.example/posts/kestrel-3-review",
  article: "studio.novera.example/new",
  settings: "chrome-extension://fillin/settings"
};

export const SCREENSHOT_STORIES: Record<
  StoreLocale,
  Record<ScreenshotAsset, ScreenshotStory>
> = {
  en: {
    "screenshot-fill": {
      eyebrow: "ONE-CLICK AUTOFILL",
      title: "Fill every field.\nGet it right.",
      description:
        "Understand field meaning, constraints, and existing values before writing and checking every result.",
      points: [
        "No empty field left behind",
        "Existing values stay intact",
        "Every write is verified"
      ],
      view: "form"
    },
    "screenshot-context": {
      eyebrow: "PAGE CONTEXT",
      title: "Read the page.\nWrite a real reply.",
      description:
        "Use the article, title, and discussion context to write a response that belongs on the current page.",
      points: [
        "Comments address the article",
        "Global search stays untouched",
        "No generic test filler"
      ],
      view: "comment"
    },
    "screenshot-article": {
      eyebrow: "LONG-FORM WRITING",
      title: "A title is a title.\nA body is a body.",
      description:
        "Recognize rich-text editors and field roles, write complete articles, and verify the real character count.",
      points: [
        "Complete long-form drafts",
        "Matches the website language",
        "Rich-text writes are verified"
      ],
      view: "article"
    },
    "screenshot-settings": {
      eyebrow: "MODEL & PRIVACY",
      title: "Your model.\nYour data.",
      description:
        "Connect any OpenAI-compatible service. Your key and profile stay on your device.",
      points: [
        "Choose your endpoint and model",
        "Settings stay on this device",
        "Fills forms, never submits"
      ],
      view: "settings"
    }
  },
  "zh-CN": {
    "screenshot-fill": {
      eyebrow: "一键填满",
      title: "表单再长，\n也能一次填对。",
      description:
        "理解字段含义、格式约束和已有内容，再逐项写入并重新检查。",
      points: ["不漏掉空字段", "保留已有内容", "填写后重新验收"],
      view: "form"
    },
    "screenshot-context": {
      eyebrow: "页面语境",
      title: "先读懂内容，\n再写下评论。",
      description:
        "读取文章标题、正文与讨论语境，生成真正针对当前内容的回复。",
      points: ["评论紧扣文章观点", "跳过全站搜索框", "拒绝随机测试文案"],
      view: "comment"
    },
    "screenshot-article": {
      eyebrow: "长文编辑",
      title: "标题是标题，\n正文是正文。",
      description:
        "识别富文本编辑器与字段用途，生成完整长文并验证真实字数。",
      points: ["约 5000 字完整长文", "中英德跟随网站", "富文本写入校验"],
      view: "article"
    },
    "screenshot-settings": {
      eyebrow: "模型与隐私",
      title: "你的模型，\n你的数据。",
      description:
        "连接任意 OpenAI-Compatible 服务；Key 与个人资料只保存在本机。",
      points: ["自定义模型与地址", "配置保存在本机", "只填写，不自动提交"],
      view: "settings"
    }
  }
};

export const PROMO_COPY = {
  en: {
    smallTagline: "Understands the page.\nFills it right.",
    smallFeatures: ["Page context", "Smart content", "Verified writes"],
    marqueeLabel: "SMART AUTOFILL FOR CHROME",
    marqueeTitle: "Read the page.\nFill it right.",
    marqueeDescription:
      "Fillin reads the page, writes content for the actual task, and checks every result. Forms, comments, and long drafts are handled by purpose.",
    marqueeFeatures: [
      "Understands pages and fields",
      "Matches the website language",
      "Checks every write"
    ],
    privacy: "Settings stay local · Never auto-submits",
    agentSteps: ["Read page", "Write content", "Check result"]
  },
  "zh-CN": {
    smallTagline: "懂页面，填得对。",
    smallFeatures: ["页面语境", "智能生成", "写后验收"],
    marqueeLabel: "CHROME 智能填表助手",
    marqueeTitle: "表单不只是填满，\n更要填对。",
    marqueeDescription:
      "读取页面语境，生成合适内容，并在写入后重新检查。评论、长文和普通表单，都按真正用途处理。",
    marqueeFeatures: ["理解页面与字段", "跟随网站语言", "填写后重新验收"],
    privacy: "配置保存在本机 · 永不自动提交",
    agentSteps: ["观察页面", "生成内容", "重新检查"]
  }
} satisfies Record<
  StoreLocale,
  {
    smallTagline: string;
    smallFeatures: string[];
    marqueeLabel: string;
    marqueeTitle: string;
    marqueeDescription: string;
    marqueeFeatures: string[];
    privacy: string;
    agentSteps: [string, string, string];
  }
>;
