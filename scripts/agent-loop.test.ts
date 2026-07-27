import assert from "node:assert/strict";
import {
  prepareAgentFields,
  runFormAgent
} from "../src/lib/formAgent.ts";
import { planFieldTask } from "../src/lib/fieldTaskPlanner.ts";
import { completeFillSuggestions } from "../src/lib/syntheticValues.ts";
import type {
  AIConfig,
  FieldDescriptor,
  FillSuggestion,
  PageContext,
  PageObservation
} from "../src/shared/types.ts";

const page: PageContext = {
  tabId: 17,
  title: "Kimi K3 实测 - 掘金",
  url: "https://juejin.cn/post/7663426727991164991",
  hostname: "juejin.cn"
};

const observation: PageObservation = {
  title: page.title,
  url: page.url,
  language: "zh-CN",
  pageType: "article",
  heading: "Kimi K3 真强，但配额太少，也有拉跨点",
  description:
    "K3 已测，确实强，但要命的是配额太少了。一天不到，一周配额已经烧完，大概生成了五个测试页面。",
  mainText:
    "作者用五个页面测试 K3，并逐项比较效果。部分案例完成度很高，但也有案例差点意思；最大的实际问题是配额消耗太快。",
  sectionHeadings: ["基准数据和特点", "五个测试案例"],
  tags: ["人工智能"],
  sampleComments: ["有用过 K3 的，也可以说说优点和缺点。"]
};

const searchField: FieldDescriptor = {
  id: "0::search",
  frameId: 0,
  localId: "search",
  kind: "text",
  label: "探索稀土掘金",
  name: "search",
  placeholder: "搜索文章",
  required: false,
  options: [],
  currentValue: ""
};
const commentField: FieldDescriptor = {
  id: "0::comment",
  frameId: 0,
  localId: "comment",
  kind: "contenteditable",
  label: "平等表达、友善交流",
  name: "comment",
  placeholder: "输入评论",
  required: false,
  options: [],
  currentValue: "",
  maxLength: 1000,
  visibleLines: 5,
  context: "评论 26"
};

const plan = planFieldTask({
  fields: [searchField, commentField],
  observation,
  instruction: ""
});
assert.deepEqual(
  plan.targetFields.map((field) => field.id),
  [commentField.id],
  "article comments must be the task, not the global search box"
);
assert.deepEqual(
  plan.skippedFields.map((field) => field.id),
  [searchField.id]
);

const localSuggestions = completeFillSuggestions(
  plan.targetFields,
  [],
  "",
  observation
);
assert.equal(localSuggestions.length, 1);
assert.match(localSuggestions[0].value, /K3|配额|五个测试/);
assert.doesNotMatch(
  localSuggestions[0].value,
  /这是由 Fillin|随机测试数据|测试数据-/
);
assert.ok(localSuggestions[0].value.length >= 60);
assert.ok(localSuggestions[0].value.length <= 220);

const legacyCommentField = {
  ...commentField,
  currentValue:
    "这是由 Fillin 根据当前字段用途自动生成的示例内容。内容使用随机测试数据。",
  hasCurrentValue: true
};
const legacyReplacement = completeFillSuggestions(
  [legacyCommentField],
  [],
  "",
  observation
)[0];
assert.equal(legacyReplacement.action, "replace");
assert.match(legacyReplacement.value, /K3|配额|五个测试/);
assert.doesNotMatch(legacyReplacement.value, /这是由 Fillin|随机测试数据/);

const prepared = prepareAgentFields({
  fields: [searchField, commentField],
  plan,
  suggestions: localSuggestions
});
assert.equal(prepared.find((field) => field.id === searchField.id)?.status, "skipped");
assert.equal(prepared.find((field) => field.id === commentField.id)?.status, "ready");

let currentFields = [searchField, commentField].map((field) => ({ ...field }));
let fillAttempts = 0;
const verificationFeedback: string[] = [];
const progressPhases: string[] = [];
const generatedComment =
  "五个页面的实测把 K3 的能力上限和配额短板都展示得很直观。模型效果强是一回事，一天不到就耗完周配额会直接影响真实开发中的迭代节奏；如果再补充每个案例的提示词与耗时，对比会更完整。";
const config: AIConfig = {
  baseUrl: "https://example.com/v1",
  apiKey: "test-key",
  model: "test-model",
  profile: "",
  dataSharingConsent: true
};
const controller = new AbortController();
const result = await runFormAgent({
  page,
  config,
  instruction: "",
  signal: controller.signal,
  dependencies: {
    scan: async () => currentFields.map((field) => ({ ...field })),
    observe: async () => observation,
    generate: async ({ fields, verificationFeedback: feedback }) => {
      assert.deepEqual(fields.map((field) => field.id), [commentField.id]);
      verificationFeedback.push(feedback);
      const suggestion: FillSuggestion = {
        fieldId: commentField.id,
        action: "fill",
        value: generatedComment,
        confidence: "high",
        businessMeaning: "针对当前文章发表的公开评论",
        semanticType: "public_comment"
      };
      return [suggestion];
    },
    fill: async (_page, field, value) => {
      fillAttempts += 1;
      if (fillAttempts === 1) throw new Error("模拟页面首次拒绝写入");
      currentFields = currentFields.map((item) =>
        item.id === field.id
          ? { ...item, currentValue: value, hasCurrentValue: true }
          : item
      );
    }
  },
  onProgress: ({ phase }) => progressPhases.push(phase)
});

assert.equal(fillAttempts, 2, "agent must retry after a failed action");
assert.match(verificationFeedback[1], /任务仍未完成|首次拒绝写入/);
assert.ok(progressPhases.includes("verifying"));
assert.equal(
  result.fields.find((field) => field.id === searchField.id)?.status,
  "skipped"
);
assert.equal(
  result.fields.find((field) => field.id === commentField.id)?.status,
  "filled"
);
assert.equal(currentFields[0].currentValue, "");
assert.equal(currentFields[1].currentValue, generatedComment);

console.log("agent loop regression passed");
