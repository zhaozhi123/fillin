# Fillin — AI 智能填表

[English](README.md)

Fillin 是一个基于 Chrome Side Panel 的 Manifest V3 扩展。它先理解当前页面和字段用途，再规划、写入并验证每一项内容，而且不会替用户提交表单。

## 当前能力

- 扫描 `input`、`textarea`、`select`、单选、复选和富文本编辑器。
- 从 label、ARIA、placeholder、name、格式约束和相邻文本中识别字段含义。
- 读取页面语境后生成与当前文章相关的评论、摘要和长文。
- 自动区分文章标题与正文，生成完整长文并验证页面中的真实字数。
- 根据当前网站语言生成英语、中文或德语内容。
- 根据 Chrome 界面语言显示英文或简体中文侧边栏。
- 支持 OpenAI、OpenRouter、DeepSeek 等兼容 `/chat/completions` 的服务。
- 支持自定义 API 地址、模型、Key、个人常用资料和本次任务说明。
- AI 不可用时，使用明显的本地合成测试数据补齐可填写空字段。
- 默认保留已有内容；只有用户明确要求改写时才会更新。
- 可以为空密码框生成随机密码，但不会读取或发送已有密码。
- 兼容常见 React 受控表单、iframe 与富文本编辑器。
- 展示“观察—规划—写入—验收”主循环，支持撤销。
- 只负责填写，不会自动提交。

## 隐私模型

Fillin 没有开发者运营的后端。API 配置和可选个人资料保存在当前设备的 `chrome.storage.local` 中。开始填写时，相关页面内容、字段信息、任务说明和用户主动保存的资料会直接发送到用户配置的 AI 服务。

配置会在浏览器重启、扩展更新或重新加载后保留；卸载扩展时 Chrome 会将其清除。导出的 JSON 备份未加密并包含 API Key，请只保存在可信设备上。

远程 AI 地址必须使用 HTTPS；只有 `localhost` 和 `127.0.0.1` 上的本地开发服务可以使用 HTTP。

详细信息请阅读英文 [隐私政策](PRIVACY.md) 与 [权限说明](docs/permissions.md)。

## 本地开发

需要 Node.js 20 或更高版本。

```bash
npm install
npm run dev
```

Vite 会持续生成 `dist`。在 `chrome://extensions` 中打开开发者模式，选择“加载已解压的扩展程序”，然后选择本项目的 `dist` 目录。

后续更新直接点击扩展卡片上的“重新加载”即可，避免先移除再重新安装；重新加载会保留已有设置。

仅预览侧边栏：

```bash
npm run dev:ui
```

访问 `http://127.0.0.1:5173/sidepanel.html`。预览模式使用固定的本地模拟数据，不会请求真实 AI 服务。

## 构建与测试

```bash
npm run check
```

可发布产物位于 `dist`。

## 产品边界

- 文件上传、隐藏字段、按钮和提交控件不会被填写。
- 条款、授权和法律声明类复选框不会被伪造为已同意。
- 已有密码不会被读取或发送给 AI。
- 本地兜底内容会明显标记为测试数据。
- 最终检查和提交始终由用户完成。

## 参与贡献

请先阅读英文 [贡献指南](CONTRIBUTING.md)。安全问题请按照 [SECURITY.md](SECURITY.md) 私下报告，不要创建公开 Issue。

## 许可证

Fillin 使用 [MIT License](LICENSE)。
