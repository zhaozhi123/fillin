import type { StoreLocale } from "./types";

export const SITE_COPY = {
  en: {
    form: {
      brand: "Northstar",
      nav: ["Products", "Customers", "About"],
      kicker: "PRODUCT DEMO REQUEST",
      title: "Tell us what your team needs",
      description: "We will prepare a product walkthrough for your workflow.",
      fields: [
        ["Full name", "Demo User 4821"],
        ["Work email", "fillin.demo@example.com"],
        ["Company", "Example Labs"],
        ["Role", "Product Manager"],
        ["City", "Berlin"],
        ["Team size", "51–100"]
      ],
      challengeLabel: "What would you like to improve?",
      challenge:
        "Reduce repetitive data entry so the team can focus on decisions that matter.",
      submit: "Request demo"
    },
    comment: {
      brand: "NOVERA",
      search: "Search Novera",
      meta: "ARTIFICIAL INTELLIGENCE · 8 MIN READ",
      title: "Kestrel 3 review: capable, but usage limits still shape real work",
      paragraphs: [
        "The author tested Kestrel 3 across five product screens. It performed well on complex layouts and code generation, but the weekly allowance was exhausted in less than a day.",
        "A useful developer tool needs more than strong single responses. Iteration speed, failure cost, and the ability to finish a real project matter just as much."
      ],
      count: "26 comments",
      comment:
        "The five-screen comparison makes both the model’s strengths and the quota limit concrete. Strong output matters, but a fast-expiring allowance can still break a real development loop. Adding the prompts and timing for each example would make the comparison even more useful.",
      guideline: "Be thoughtful and constructive",
      send: "Post"
    },
    article: {
      brand: "NOVERA",
      section: "New article",
      saved: "Draft saved",
      toolbar: ["Undo", "Heading", "Bold", "List", "Quote", "Image", "Link"],
      title: "How context-aware autofill should understand a page",
      paragraphs: [
        "Autofill is not valuable merely because it reduces typing. A reliable system first understands the page, the purpose of each field, and the user’s goal before deciding what to write.",
        "Titles, body copy, field labels, and nearby instructions form the task context. Considering them together prevents comments, summaries, and long-form writing from becoming generic templates.",
        "Writing a value does not mean the task is complete. The system must read the editor again and confirm the real length, field format, and rendered result."
      ],
      headings: ["1. Start by observing the page", "2. Verify after writing"],
      count: "4,982 characters",
      mode: "Markdown enabled",
      publish: "Publish"
    },
    settings: {
      kicker: "OPENAI-COMPATIBLE API",
      title: "Connect your own model",
      saved: "Saved on this device",
      apiUrl: "API URL",
      model: "Model",
      apiKey: "API Key",
      privacyTitle: "Your key and profile never pass through Fillin servers",
      privacyDescription:
        "Settings use chrome.storage.local and are sent only to the AI service you choose when Fillin generates content."
    }
  },
  "zh-CN": {
    form: {
      brand: "Northstar",
      nav: ["产品", "客户", "关于我们"],
      kicker: "产品体验申请",
      title: "告诉我们你的团队需求",
      description: "提交信息后，我们会为你准备适合的产品演示。",
      fields: [
        ["姓名", "测试用户 4821"],
        ["工作邮箱", "fillin.demo@example.com"],
        ["公司", "示例科技有限公司"],
        ["当前职位", "产品经理"],
        ["所在城市", "上海"],
        ["团队规模", "51–100 人"]
      ],
      challengeLabel: "希望解决的问题",
      challenge: "减少重复录入，让团队把时间投入真正需要判断的工作。",
      submit: "提交申请"
    },
    comment: {
      brand: "NOVERA",
      search: "搜索 Novera",
      meta: "人工智能 · 8 分钟阅读",
      title: "Kestrel 3 实测：能力很强，但配额仍会影响真实工作",
      paragraphs: [
        "作者使用五个产品页面测试了 Kestrel 3，在复杂布局与代码生成上表现突出，但一周配额不到一天就被耗尽。",
        "真正影响开发体验的不只是单次生成质量，还包括迭代速度、失败成本以及能否持续完成真实项目。"
      ],
      count: "评论 26",
      comment:
        "五个页面的对比把模型能力和配额短板展示得很直观。输出效果强是一回事，配额过快耗尽仍会打断真实开发中的迭代节奏；如果再补充各案例的提示词与耗时，对比会更完整。",
      guideline: "理性表达，友善交流",
      send: "发送"
    },
    article: {
      brand: "NOVERA",
      section: "写文章",
      saved: "草稿已保存",
      toolbar: ["撤销", "标题", "加粗", "列表", "引用", "图片", "链接"],
      title: "如何让自动填表真正理解页面语境",
      paragraphs: [
        "自动填写的价值并不只是减少键盘输入。真正可靠的系统需要先理解页面、字段用途与任务目标，再决定应该生成什么内容。",
        "标题、正文、字段标签和附近说明共同构成任务语境。只有把这些信息放在一起分析，评论、摘要与长文才不会退化为可以套用在任何页面上的模板。",
        "内容写入并不代表任务完成。系统还需要重新读取编辑器状态，确认真实字数、字段格式和最终显示结果都符合预期。"
      ],
      headings: ["一、从页面观察开始", "二、执行之后重新检查"],
      count: "字数：4,982",
      mode: "Markdown 语法输入中",
      publish: "发布"
    },
    settings: {
      kicker: "OPENAI-COMPATIBLE API",
      title: "连接你自己的模型",
      saved: "配置保存在本机",
      apiUrl: "API 地址",
      model: "模型",
      apiKey: "API Key",
      privacyTitle: "Key 与个人资料不会经过 Fillin 服务器",
      privacyDescription:
        "配置使用 chrome.storage.local 保存在当前设备，只在生成内容时发送到你选择的 AI 服务。"
    }
  }
} satisfies Record<StoreLocale, Record<string, unknown>>;
