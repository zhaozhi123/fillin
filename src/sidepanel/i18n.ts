export type UiLocale = "en" | "zh-CN";

export function getUiLocale(): UiLocale {
  const forcedLocale = new URLSearchParams(window.location.search).get(
    "locale"
  );
  if (forcedLocale === "zh-CN") return "zh-CN";
  if (forcedLocale === "en") return "en";

  const language =
    chrome.i18n?.getUILanguage?.() || navigator.language || "en";
  return language.toLowerCase().startsWith("zh") ? "zh-CN" : "en";
}

export const UI_COPY = {
  en: {
    app: {
      unknownError: "Unknown error",
      footer: "Fillin fills fields and never submits forms"
    },
    header: {
      tagline: "Autofill that understands the page",
      settings: "Settings"
    },
    error: {
      title: "This task did not finish",
      retry: "Try again"
    },
    page: {
      aria: "Current page",
      loading: "Reading the current page",
      scanning: "Checking fillable content…",
      found: (count: number) => `${count} fillable fields found`,
      empty: "No fillable fields found yet",
      rescan: "Scan page again"
    },
    agent: {
      filledWithFailures: (filled: number, failed: number) =>
        `${filled} filled, ${failed} failed`,
      updated: (count: number) => `${count} fields updated`,
      handled: (count: number) => `${count} fields handled`,
      filled: (count: number) => `${count} fields filled`,
      alreadyComplete: "The page is already complete",
      failureDescription:
        "Fields that rejected a value are marked. Try again or adjust them manually.",
      completedDescription:
        "Review the page before submitting. Fillin never submits forms for you.",
      preservedDescription:
        "Existing values were preserved and no empty field needed a rewrite.",
      checkAgain: "Check again",
      undo: "Undo",
      runningTitle: "Working through this form",
      idleTitle: "Let Fillin handle repetitive forms",
      scanning: "First, identify every field on the page.",
      thinking: "Understanding the page and deciding what the task needs.",
      verifying: "Reading the page again to confirm every target value.",
      writing: (count: number) => `${count} fields are still being written.`,
      ready:
        "Understand the page and field purpose, then write and verify each result.",
      noFields: "Open a form and Fillin will identify fillable content.",
      stages: [
        "Observe the page and fields",
        "Plan the task and generate",
        "Write values one by one",
        "Scan again and verify"
      ],
      stop: "Stop",
      start: "Fill every field"
    },
    task: {
      label: "What should Fillin do?",
      optional: "Optional",
      placeholder:
        "Example: Write a long article about context-aware autofill",
      hint: "Leave blank to let Fillin infer the task and complete every empty field"
    },
    fields: {
      statuses: {
        found: "Found",
        ready: "Ready",
        filling: "Writing",
        filled: "Complete",
        preserved: "Preserved",
        skipped: "Not part of task",
        error: "Failed"
      },
      updated: "Updated",
      updating: "Updating",
      readyToUpdate: "Ready to update",
      length: (target: number, actual?: number) =>
        actual
          ? `Target ${target} · Actual ${actual} characters`
          : `About ${target} characters suggested`,
      details: "Field details",
      count: (count: number) => `${count} items`
    },
    setup: {
      title: "Connect AI for context-aware content",
      description:
        "Fillin works with local synthetic data without AI. Connect a service to use your profile and page context.",
      action: "Set up now"
    },
    settings: {
      title: "Settings",
      close: "Close",
      categories: "Settings categories",
      service: "AI service",
      profile: "My profile",
      serviceDescription:
        "Works with OpenAI, OpenRouter, DeepSeek, and other compatible services.",
      apiUrl: "API URL",
      apiHint:
        "Enter the base URL through /v1; Fillin requests /chat/completions automatically",
      model: "Model",
      apiKey: "API Key",
      hideKey: "Hide API Key",
      showKey: "Show API Key",
      privacy:
        "Your key and profile use chrome.storage.local and never pass through Fillin servers. Chrome removes them when the extension is uninstalled. When you start filling, fields and profile data are sent to your configured AI service.",
      consent:
        "I understand that relevant page fields, my instruction, and saved profile data are sent to the AI service I configure when I start a task.",
      backupTitle: "Back up before reinstalling",
      backupDescription:
        "Export settings now and import them after reinstalling. The backup includes an unencrypted API key; store it safely.",
      export: "Export backup",
      import: "Import backup",
      profileTitle: "Tell Fillin about you",
      profileDescription:
        "More detail improves matching. Save only information you want to use in forms.",
      profileLabel: "Reusable profile",
      profilePlaceholder: [
        "Name: Alex Miller",
        "Email: alex@example.com",
        "Phone: +44 7700 900000",
        "City: London",
        "Role: Product Manager",
        "Bio: …"
      ].join("\n"),
      profileHint:
        "Do not store passwords, verification codes, or payment card numbers.",
      saveHint:
        "Updates and reloads preserve settings; export a backup before uninstalling",
      saved: "Saved",
      saving: "Saving…",
      save: "Save settings",
      incomplete: "Complete the API URL, model, and key",
      consentRequired: "Confirm the data-sharing notice first",
      invalidUrl:
        "Use HTTPS for remote APIs. HTTP is allowed only for localhost or 127.0.0.1.",
      backupConfirm:
        "The backup contains your unencrypted API key. Save it only on a trusted device. Continue?",
      backupSaved: "Backup saved on this device",
      backupImported: "Imported. Choose Save settings to finish restoring",
      backupInvalid: "The selected file is not a valid Fillin settings backup"
    }
  },
  "zh-CN": {
    app: {
      unknownError: "未知错误",
      footer: "Fillin 只填写，不会自动提交"
    },
    header: {
      tagline: "懂页面的智能填表助手",
      settings: "设置"
    },
    error: {
      title: "这次没有完成",
      retry: "重试"
    },
    page: {
      aria: "当前页面",
      loading: "正在读取当前页面",
      scanning: "正在检查可填写内容…",
      found: (count: number) => `发现 ${count} 个可填写字段`,
      empty: "尚未发现可填写字段",
      rescan: "重新扫描页面"
    },
    agent: {
      filledWithFailures: (filled: number, failed: number) =>
        `已填写 ${filled} 项，${failed} 项失败`,
      updated: (count: number) => `已更新 ${count} 项`,
      handled: (count: number) => `已处理 ${count} 项`,
      filled: (count: number) => `已填写 ${count} 项`,
      alreadyComplete: "页面内容已经完整",
      failureDescription:
        "未接受生成值的字段已标记，可再次尝试或手动调整。",
      completedDescription:
        "请在提交前检查一遍，Fillin 不会替你提交表单。",
      preservedDescription: "已有内容已保留，没有需要改写的空字段。",
      checkAgain: "再次检查",
      undo: "撤销",
      runningTitle: "正在处理这份表单",
      idleTitle: "把重复填写交给 Fillin",
      scanning: "先确认页面上有哪些字段。",
      thinking: "正在结合页面内容判断真正的填写任务。",
      verifying: "正在重新读取页面，确认目标内容已经生效。",
      writing: (count: number) => `还有 ${count} 项正在写入页面。`,
      ready: "先理解页面与字段用途，再生成、填写并重新检查。",
      noFields: "打开一份表单，Fillin 会自动识别可填写内容。",
      stages: [
        "观察页面与字段",
        "判断任务并生成",
        "逐项写入页面",
        "重新扫描验收"
      ],
      stop: "停止",
      start: "一键填满"
    },
    task: {
      label: "这次要填写什么",
      optional: "可选",
      placeholder: "例如：写一篇介绍 AI 填表工具的长文",
      hint: "可以留空；Fillin 会自动生成并补齐所有空字段"
    },
    fields: {
      statuses: {
        found: "已识别",
        ready: "待填写",
        filling: "正在填写",
        filled: "已完成",
        preserved: "已保留",
        skipped: "非任务字段",
        error: "填写失败"
      },
      updated: "已更新",
      updating: "正在更新",
      readyToUpdate: "待更新",
      length: (target: number, actual?: number) =>
        actual
          ? `目标 ${target} 字 · 实际 ${actual} 字`
          : `建议约 ${target} 字`,
      details: "字段明细",
      count: (count: number) => `${count} 项`
    },
    setup: {
      title: "连接 AI，生成更贴合场景的内容",
      description:
        "不连接也能使用本地合成数据填满；连接后会优先使用你的资料和页面语义。",
      action: "现在设置"
    },
    settings: {
      title: "设置",
      close: "关闭",
      categories: "设置分类",
      service: "AI 服务",
      profile: "我的资料",
      serviceDescription:
        "支持 OpenAI、OpenRouter、DeepSeek 及其他兼容服务。",
      apiUrl: "API 地址",
      apiHint: "可填写到 /v1，Fillin 会自动请求 /chat/completions",
      model: "模型",
      apiKey: "API Key",
      hideKey: "隐藏 API Key",
      showKey: "显示 API Key",
      privacy:
        "Key 与个人资料使用 chrome.storage.local 保存在本机，不经过 Fillin 的服务器；卸载扩展时 Chrome 会清除这些数据。开始填写时，字段与资料会发送到你配置的 AI 服务。",
      consent:
        "我了解：开始填写时，相关页面字段、任务说明和我保存的资料会发送到我配置的 AI 服务。",
      backupTitle: "重装前备份到本机",
      backupDescription:
        "导出后，重装时导入即可恢复全部设置。备份文件包含未加密的 API Key，请妥善保存。",
      export: "导出备份",
      import: "导入备份",
      profileTitle: "告诉 Fillin 关于你的信息",
      profileDescription:
        "写得越具体，匹配越准确。只需填写你愿意用于表单的内容。",
      profileLabel: "常用资料",
      profilePlaceholder: [
        "姓名：林晓",
        "邮箱：lin@example.com",
        "电话：138 0000 0000",
        "城市：上海",
        "职位：产品经理",
        "个人简介：…"
      ].join("\n"),
      profileHint: "不要保存密码、验证码、银行卡号等敏感信息。",
      saveHint: "更新或重新加载会保留；卸载前请先导出备份",
      saved: "已保存",
      saving: "保存中…",
      save: "保存设置",
      incomplete: "请完整填写 API 地址、模型和 Key",
      consentRequired: "请先确认数据发送说明",
      invalidUrl:
        "远程 API 必须使用 HTTPS；仅 localhost 或 127.0.0.1 可使用 HTTP",
      backupConfirm:
        "备份文件会包含你的 API Key，且不会加密。请只保存在你信任的设备上。继续导出吗？",
      backupSaved: "备份已保存到本机",
      backupImported: "已导入，请点击“保存设置”完成恢复",
      backupInvalid: "无法读取配置备份"
    }
  }
} as const;
