import assert from "node:assert/strict";
import { detectPageLanguage } from "../src/lib/pageLanguage.ts";
import { getSyntheticLocale } from "../src/lib/syntheticLocale.ts";
import { completeFillSuggestions } from "../src/lib/syntheticValues.ts";
import type {
  FieldDescriptor,
  PageObservation
} from "../src/shared/types.ts";

const observations: Record<"zh" | "en" | "de", PageObservation> = {
  zh: {
    title: "如何提高团队协作效率",
    url: "https://example.cn/article",
    language: "zh-CN",
    pageType: "article-editor",
    heading: "如何提高团队协作效率",
    description: "本文讨论团队如何通过明确目标和反馈机制提高协作效率。",
    mainText: "团队需要明确目标，建立可以验证的工作流程，并通过持续反馈减少返工。",
    sectionHeadings: ["明确目标", "建立反馈"],
    tags: ["团队协作"],
    sampleComments: []
  },
  en: {
    title: "How teams can improve collaboration",
    url: "https://example.com/article",
    language: "en-US",
    pageType: "article-editor",
    heading: "How teams can improve collaboration",
    description:
      "This article explains how a team can define its goals, create a reliable workflow, and improve results through evidence and feedback.",
    mainText:
      "A clear process helps the team reduce rework and identify which assumptions should be tested before a solution is expanded.",
    sectionHeadings: ["Define the goal", "Create a feedback loop"],
    tags: ["teamwork"],
    sampleComments: []
  },
  de: {
    title: "Wie Teams ihre Zusammenarbeit verbessern",
    url: "https://example.de/artikel",
    language: "de-DE",
    pageType: "article-editor",
    heading: "Wie Teams ihre Zusammenarbeit verbessern",
    description:
      "Dieser Beitrag zeigt, wie ein Team seine Ziele klärt, einen verlässlichen Prozess aufbaut und die Ergebnisse durch Rückmeldungen verbessert.",
    mainText:
      "Die Methode wird mit klaren Schritten geprüft, damit das Team weniger Nacharbeit hat und Entscheidungen auf Daten statt auf Vermutungen beruhen.",
    sectionHeadings: ["Das Ziel bestimmen", "Rückmeldung verankern"],
    tags: ["Zusammenarbeit"],
    sampleComments: []
  }
};

assert.equal(
  detectPageLanguage({
    declared: "",
    text: observations.zh.description
  }),
  "zh"
);
assert.equal(
  detectPageLanguage({
    declared: "",
    text: observations.en.description
  }),
  "en"
);
assert.equal(
  detectPageLanguage({
    declared: "",
    text: observations.de.description
  }),
  "de"
);

function makeFields(language: "zh" | "en" | "de"): FieldDescriptor[] {
  const labels = {
    zh: { title: "请输入文章标题", body: "文章正文" },
    en: { title: "Article title", body: "Article body" },
    de: { title: "Artikeltitel", body: "Artikelinhalt" }
  }[language];
  return [
    {
      id: `${language}-title`,
      kind: "text",
      label: labels.title,
      name: labels.title,
      placeholder: labels.title,
      required: true,
      options: [],
      currentValue: "",
      maxLength: 100
    },
    {
      id: `${language}-body`,
      kind: "contenteditable",
      label: labels.body,
      name: labels.body,
      placeholder: labels.body,
      required: true,
      options: [],
      currentValue: "",
      visibleLines: 30
    }
  ];
}

const chineseValues = completeFillSuggestions(
  makeFields("zh"),
  [],
  "",
  observations.zh
);
assert.match(chineseValues[0].value, /[\u3400-\u9fff]/);
assert.match(chineseValues[1].value, /明确|分析|实践|反馈/);
assert.equal(chineseValues[1].value.length, 5000);

const englishValues = completeFillSuggestions(
  makeFields("en"),
  [],
  "",
  observations.en
);
assert.doesNotMatch(englishValues[0].value, /[\u3400-\u9fff]/);
assert.match(englishValues[0].value, /Fillin|Form|Input/);
assert.match(englishValues[1].value, /This article|Define the Problem|analysis/i);
assert.doesNotMatch(englishValues[1].value, /[\u3400-\u9fff]/);
assert.equal(englishValues[1].value.length, 5000);

const germanFields = makeFields("de");
const germanValues = completeFillSuggestions(
  germanFields,
  [
    {
      fieldId: germanFields[0].id,
      value: "这是一个不应该被采用的中文标题",
      action: "fill",
      confidence: "high",
      businessMeaning: "Artikeltitel",
      semanticType: "article_title"
    }
  ],
  "",
  observations.de
);
assert.doesNotMatch(germanValues[0].value, /[\u3400-\u9fff]/);
assert.ok(
  getSyntheticLocale("de").articleTitles.some((title) =>
    title.startsWith(germanValues[0].value)
  ),
  "German title should come from the localized synthetic title set"
);
assert.match(germanValues[1].value, /Dieser Beitrag|Problem und Ziel|Analyse/);
assert.doesNotMatch(germanValues[1].value, /[\u3400-\u9fff]/);
assert.equal(germanValues[1].value.length, 5000);

const germanComment: FieldDescriptor = {
  id: "de-comment",
  kind: "textarea",
  label: "Kommentar schreiben",
  name: "kommentar",
  placeholder: "Kommentar hinterlassen",
  required: false,
  options: [],
  currentValue: "",
  maxLength: 1000
};
const germanCommentValue = completeFillSuggestions(
  [germanComment],
  [],
  "",
  { ...observations.de, pageType: "article" }
)[0].value;
assert.match(germanCommentValue, /Beitrag|Aussage|Testbedingungen|Geltungsbereich/);
assert.doesNotMatch(germanCommentValue, /[\u3400-\u9fff]/);

console.log("localized generation regression passed");
