import type { ProductView, StoreLocale } from "./types";

export type PanelField = {
  label: string;
  meaning: string;
  status: "done" | "skip";
  value?: string;
};

export type PanelViewData = {
  host: string;
  found: string;
  result: string;
  description: string;
  fields: PanelField[];
};

type PanelCopy = {
  tagline: string;
  recheck: string;
  details: string;
  complete: string;
  skipped: string;
  footer: string;
  itemSuffix: string;
  views: Record<Exclude<ProductView, "settings">, PanelViewData>;
  settings: {
    service: string;
    title: string;
    profile: string;
    heading: string;
    description: string;
    apiUrl: string;
    model: string;
    apiKey: string;
    localNote: string;
    save: string;
  };
};

export const PANEL_COPY: Record<StoreLocale, PanelCopy> = {
  en: {
    tagline: "Autofill that understands the page",
    recheck: "Check again",
    details: "Field details",
    complete: "Complete",
    skipped: "Not part of this task",
    footer: "Fillin fills fields and never submits forms",
    itemSuffix: "items",
    views: {
      form: {
        host: "apply.northstar.example",
        found: "7 fillable fields found",
        result: "7 fields completed",
        description: "The page was read again and every target value is present.",
        fields: [
          {
            label: "Full name",
            meaning: "Applicant’s complete name",
            value: "Demo User 4821",
            status: "done"
          },
          {
            label: "Work email",
            meaning: "Email used to contact the applicant",
            value: "fillin.demo@example.com",
            status: "done"
          },
          {
            label: "What would you like to improve?",
            meaning: "Product demo request",
            value: "Reduce repetitive data entry and protect focus.",
            status: "done"
          }
        ]
      },
      comment: {
        host: "journal.novera.example",
        found: "2 fillable fields found",
        result: "1 field completed",
        description:
          "The comment uses the article context. Site search was excluded.",
        fields: [
          {
            label: "Be thoughtful and constructive",
            meaning: "A comment on the current article",
            value: "The five-screen comparison makes the strengths and limits concrete…",
            status: "done"
          },
          {
            label: "Search Novera",
            meaning: "Site-wide search",
            status: "skip"
          }
        ]
      },
      article: {
        host: "studio.novera.example",
        found: "3 fillable fields found",
        result: "2 fields completed",
        description:
          "The body contains 4,982 characters and matches the target.",
        fields: [
          {
            label: "Article title",
            meaning: "Title · target about 60 characters",
            value: "How context-aware autofill should understand a page",
            status: "done"
          },
          {
            label: "Article body",
            meaning: "Long-form body · target about 5,000 characters",
            value: "From page observation to task planning and verification…",
            status: "done"
          },
          {
            label: "Language",
            meaning: "Current value: English",
            status: "skip"
          }
        ]
      }
    },
    settings: {
      service: "AI service",
      title: "Connect a model",
      profile: "My profile",
      heading: "Use the AI service you choose",
      description:
        "Works with OpenAI, OpenRouter, DeepSeek, and other compatible services.",
      apiUrl: "API URL",
      model: "Model",
      apiKey: "API Key",
      localNote:
        "Your key and profile use chrome.storage.local and stay on this device.",
      save: "Save settings"
    }
  },
  "zh-CN": {
    tagline: "懂页面的智能填表助手",
    recheck: "再次检查",
    details: "字段明细",
    complete: "已完成",
    skipped: "非任务字段",
    footer: "Fillin 只填写，不会自动提交",
    itemSuffix: "项",
    views: {
      form: {
        host: "apply.northstar.example",
        found: "发现 7 个可填写字段",
        result: "已填写 7 项",
        description: "已重新读取页面，所有目标字段均已生效。",
        fields: [
          {
            label: "姓名",
            meaning: "申请人的完整姓名",
            value: "测试用户 4821",
            status: "done"
          },
          {
            label: "工作邮箱",
            meaning: "用于联系申请人的邮箱",
            value: "fillin.demo@example.com",
            status: "done"
          },
          {
            label: "希望解决的问题",
            meaning: "产品体验申请说明",
            value: "减少重复录入，让团队专注判断。",
            status: "done"
          }
        ]
      },
      comment: {
        host: "journal.novera.example",
        found: "发现 2 个可填写字段",
        result: "已填写 1 项",
        description: "评论已根据文章内容生成，顶部搜索框未纳入任务。",
        fields: [
          {
            label: "理性表达，友善交流",
            meaning: "针对当前文章发表的评论",
            value: "五个页面的对比把模型能力和配额短板展示得很直观……",
            status: "done"
          },
          {
            label: "搜索 Novera",
            meaning: "网站全局搜索",
            status: "skip"
          }
        ]
      },
      article: {
        host: "studio.novera.example",
        found: "发现 3 个可填写字段",
        result: "已填写 2 项",
        description: "正文写入 4,982 字，页面字数与目标一致。",
        fields: [
          {
            label: "文章标题",
            meaning: "标题 · 目标约 28 字",
            value: "如何让自动填表真正理解页面语境",
            status: "done"
          },
          {
            label: "文章正文",
            meaning: "长文正文 · 目标约 5,000 字",
            value: "从页面观察、任务判断到写入验收……",
            status: "done"
          },
          {
            label: "选择语言",
            meaning: "当前值：中文",
            status: "skip"
          }
        ]
      }
    },
    settings: {
      service: "AI 服务",
      title: "连接模型",
      profile: "我的资料",
      heading: "使用你选择的 AI 服务",
      description: "支持 OpenAI、OpenRouter、DeepSeek 及其他兼容服务。",
      apiUrl: "API 地址",
      model: "模型",
      apiKey: "API Key",
      localNote:
        "Key 与个人资料使用 chrome.storage.local 保存在本机。",
      save: "保存配置"
    }
  }
};
