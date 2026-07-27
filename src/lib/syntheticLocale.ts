import type { SupportedPageLanguage } from "./pageLanguage";

export type SyntheticLocale = {
  proseSentences: string[];
  articleTitles: string[];
  firstName: string;
  lastName: string;
  fullNamePrefix: string;
  companyPrefix: string;
  jobTitle: string;
  streetPrefix: string;
  streetSuffix: string;
  city: string;
  region: string;
  country: string;
  phonePrefix: string;
  testDataPrefix: string;
  testOptionPrefix: string;
  minimumLengthFiller: string;
  commentFallback: string;
  commentWithPoint: (point: string) => string;
};

const LOCALES: Record<SupportedPageLanguage, SyntheticLocale> = {
  zh: {
    proseSentences: [
      "这是根据当前字段用途生成的本地示例内容。",
      "其中使用明显的测试数据，方便用户在提交前检查和修改。",
      "如需更贴合页面语境的内容，可以连接 AI 服务后再次生成。",
      "Fillin 只负责填写，不会自动提交当前表单。"
    ],
    articleTitles: [
      "让 AI 理解每个字段：Fillin 一键自动填表实践",
      "从识别到填满：Fillin 的智能表单自动化方案",
      "告别重复输入：用 Fillin 自动生成完整表单数据"
    ],
    firstName: "明",
    lastName: "陈",
    fullNamePrefix: "测试用户",
    companyPrefix: "示例科技",
    jobTitle: "产品经理",
    streetPrefix: "示例路",
    streetSuffix: "号",
    city: "上海",
    region: "上海",
    country: "中国",
    phonePrefix: "138000",
    testDataPrefix: "测试数据",
    testOptionPrefix: "测试选项",
    minimumLengthFiller: "补充内容",
    commentFallback:
      "文章把核心判断、实际过程和适用条件联系起来，观点比较清楚。如果再补充关键测试条件、数据来源与反例，读者会更容易判断结论的适用范围。",
    commentWithPoint: (point) =>
      `文中提到“${point}”，这个观察很有参考价值。把结论和实际过程放在一起，比只给观点更有说服力；如果再补充关键测试条件与反例，读者会更容易判断结论的适用范围。`
  },
  en: {
    proseSentences: [
      "This local example was generated for the purpose of the current field.",
      "It uses clearly synthetic data so it can be reviewed before submission.",
      "Connect an AI service when content needs to reflect the page in greater depth.",
      "Fillin fills the field but never submits the form automatically."
    ],
    articleTitles: [
      "How Fillin Understands Fields and Automates Repetitive Forms",
      "From Detection to Completion: Practical AI Form Automation",
      "Reducing Repetitive Input with Context-Aware Form Filling"
    ],
    firstName: "Alex",
    lastName: "Miller",
    fullNamePrefix: "Test User",
    companyPrefix: "Example Labs",
    jobTitle: "Product Manager",
    streetPrefix: "Example Street",
    streetSuffix: "",
    city: "London",
    region: "Greater London",
    country: "United Kingdom",
    phonePrefix: "07700",
    testDataPrefix: "Test data",
    testOptionPrefix: "Test option",
    minimumLengthFiller: " Additional details.",
    commentFallback:
      "The article connects its main conclusion with the process and conditions behind it. Adding the key test setup, source data, and one counterexample would make it easier to judge where the conclusion applies.",
    commentWithPoint: (point) =>
      `The point that “${point}” is particularly useful. Connecting the conclusion to the actual process is more convincing than stating an opinion alone; adding the key test conditions and a counterexample would make its scope clearer.`
  },
  de: {
    proseSentences: [
      "Dieser lokale Beispieltext wurde passend zum Zweck des aktuellen Feldes erzeugt.",
      "Er verwendet klar erkennbare Testdaten, die vor dem Absenden geprüft werden können.",
      "Für stärker auf den Seitenkontext abgestimmte Inhalte kann ein KI-Dienst verbunden werden.",
      "Fillin füllt das Feld aus, sendet das Formular jedoch niemals automatisch ab."
    ],
    articleTitles: [
      "Wie Fillin Formularfelder erkennt und wiederkehrende Eingaben automatisiert",
      "Von der Erkennung bis zum Ausfüllen: Intelligente Formularautomatisierung",
      "Weniger Routinearbeit durch kontextbezogenes automatisches Ausfüllen"
    ],
    firstName: "Anna",
    lastName: "Müller",
    fullNamePrefix: "Testperson",
    companyPrefix: "Beispieltechnik",
    jobTitle: "Produktmanagerin",
    streetPrefix: "Beispielstraße",
    streetSuffix: "",
    city: "Berlin",
    region: "Berlin",
    country: "Deutschland",
    phonePrefix: "01512",
    testDataPrefix: "Testdaten",
    testOptionPrefix: "Testoption",
    minimumLengthFiller: " Zusätzliche Angaben.",
    commentFallback:
      "Der Beitrag verbindet seine Kernaussage nachvollziehbar mit dem Vorgehen und den geltenden Bedingungen. Angaben zum genauen Testaufbau, zu den Datenquellen und zu einem Gegenbeispiel würden den Geltungsbereich noch klarer machen.",
    commentWithPoint: (point) =>
      `Besonders hilfreich ist die Aussage „${point}“. Die Verbindung von Ergebnis und praktischem Vorgehen überzeugt mehr als eine isolierte Meinung; Angaben zu den Testbedingungen und ein Gegenbeispiel würden den Geltungsbereich noch klarer machen.`
  }
};

export function getSyntheticLocale(language: SupportedPageLanguage) {
  return LOCALES[language];
}
