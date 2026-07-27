import {
  languageMatchesText,
  type SupportedPageLanguage
} from "./pageLanguage";

type SectionBlueprint = {
  heading: string;
  focus: string;
};

type ArticleLocale = {
  fallbackTopic: string;
  introduction: (topic: string) => string;
  continuation: (round: number) => string;
  sections: SectionBlueprint[];
  paragraphs: (
    topic: string,
    focus: string,
    continuation: string
  ) => string[];
};

const ARTICLE_LOCALES: Record<SupportedPageLanguage, ArticleLocale> = {
  zh: {
    fallbackTopic: "当前主题",
    introduction: (topic) =>
      `围绕“${topic}”，本文将从问题背景、分析框架、实践方法、常见误区和长期改进等多个角度展开讨论。文章不仅给出观点，也会解释观点成立的条件以及如何把它转化为可以执行的步骤。读者可以结合自己的实际场景调整其中的方法，并在行动后通过反馈继续修正。`,
    continuation: (round) =>
      round > 0 ? `在前文分析的基础上，第 ${round + 1} 轮讨论继续` : "本节",
    sections: [
      { heading: "先明确问题与目标", focus: "界定问题边界、目标读者和期望结果" },
      { heading: "建立完整的分析框架", focus: "把复杂议题拆成背景、原因、方法、执行和验证" },
      { heading: "从具体场景开始", focus: "用实际案例呈现问题以及传统处理方式的局限" },
      { heading: "设计可执行的方法", focus: "把原则转化为可以逐步完成和检查的流程" },
      { heading: "处理实施中的难点", focus: "分析资源、协作、质量和不确定性带来的挑战" },
      { heading: "建立反馈与验证机制", focus: "通过数据、观察和复盘判断方案是否有效" },
      { heading: "避免常见误区", focus: "识别容易造成返工、失真或失控的做法" },
      { heading: "形成长期能力", focus: "把一次性的解决方案沉淀为稳定流程与知识" }
    ],
    paragraphs: (topic, focus, continuation) => [
      `${continuation}围绕“${topic}”展开，重点是${focus}。真正有价值的文章不能只给出结论，还要让读者理解结论产生的条件、适用范围以及落地时可能遇到的变化。因此，分析需要从读者所处的环境开始，把抽象观点放回具体任务中，说明为什么要这样做、先做什么、后做什么，以及每一步如何判断是否完成。`,
      `在实践中，同一个方法往往会因为团队规模、经验水平、时间预算和目标差异而呈现不同结果。讨论“${topic}”时，应当同时关注理想方案和现实约束：理想方案帮助我们看清方向，现实约束则决定当前最合理的动作。两者结合，才能避免内容停留在口号层面，也能减少照搬模板造成的偏差。`,
      `更稳妥的做法是先完成一个可以验证的小闭环。把目标拆成清晰步骤，为每一步设置输入、产出和检查标准，再根据结果决定是否扩大范围。如果发现信息不足，就补充事实；如果结果偏离预期，就回到假设重新判断。这样的过程可以显著降低返工成本，让改进建立在证据而不是感觉之上。`,
      `从长期看，${focus}并不是一次性的技巧，而是一种可以持续积累的能力。每次执行后记录有效做法、失败原因和环境变化，逐渐形成适合自己的方法库。下一次遇到相似问题时，就可以复用成熟部分，把精力投入真正需要判断和创造的环节。`
    ]
  },
  en: {
    fallbackTopic: "the current topic",
    introduction: (topic) =>
      `This article examines “${topic}” through its background, analytical framework, practical methods, common pitfalls, and opportunities for long-term improvement. It explains not only what to do, but also why the conclusions hold and how they can be converted into verifiable actions. Readers can adapt the approach to their own situation and improve it through feedback.`,
    continuation: (round) =>
      round > 0
        ? `Building on the earlier analysis, review cycle ${round + 1}`
        : "This section",
    sections: [
      { heading: "Define the Problem and the Goal", focus: "clarifying the boundaries, audience, and expected outcome" },
      { heading: "Build a Complete Analytical Framework", focus: "separating context, causes, methods, execution, and validation" },
      { heading: "Start with a Concrete Situation", focus: "using realistic examples to expose practical limitations" },
      { heading: "Design an Actionable Method", focus: "turning principles into steps that can be completed and checked" },
      { heading: "Handle Implementation Challenges", focus: "addressing constraints in time, quality, resources, and collaboration" },
      { heading: "Create a Feedback and Validation Loop", focus: "using evidence and review to determine whether the approach works" },
      { heading: "Avoid Common Pitfalls", focus: "identifying shortcuts that create rework or misleading conclusions" },
      { heading: "Develop a Reusable Capability", focus: "turning a one-off solution into a durable process and knowledge base" }
    ],
    paragraphs: (topic, focus, continuation) => [
      `${continuation} focuses on ${focus}. A useful discussion of “${topic}” cannot stop at a conclusion. It must explain the conditions behind that conclusion, the situations in which it applies, and the changes that may appear during implementation. Abstract ideas become useful only when they are connected to a concrete task, a sequence of actions, and a clear definition of completion.`,
      `In practice, the same method can produce very different results depending on team size, experience, time, available resources, and the desired outcome. A sound approach therefore considers both the ideal direction and the constraints of the present situation. The ideal reveals where to go; the constraints determine the most reasonable next action. Keeping both in view prevents the discussion from becoming a slogan or an inflexible template.`,
      `A reliable starting point is a small loop that can be verified. Break the goal into explicit steps, define the input and expected output for each one, and decide in advance what evidence counts as success. If information is missing, collect it. If the result differs from the expectation, revisit the assumption before expanding the solution. This reduces rework and makes improvement depend on evidence rather than intuition.`,
      `Over time, ${focus} becomes more than an isolated technique. Recording effective decisions, failed attempts, and changing conditions creates a reusable body of knowledge. When a similar problem appears, proven parts can be reused while attention is reserved for the aspects that genuinely require judgment and creativity.`
    ]
  },
  de: {
    fallbackTopic: "das aktuelle Thema",
    introduction: (topic) =>
      `Dieser Beitrag untersucht „${topic}“ anhand des Hintergrunds, eines klaren Analyserahmens, praktischer Methoden, typischer Fehler und langfristiger Verbesserungsmöglichkeiten. Er beschreibt nicht nur mögliche Ergebnisse, sondern auch ihre Voraussetzungen und die Umsetzung in überprüfbare Schritte. Die Vorgehensweise lässt sich an den eigenen Kontext anpassen und durch Rückmeldungen weiterentwickeln.`,
    continuation: (round) =>
      round > 0
        ? `Aufbauend auf der bisherigen Analyse betrachtet die ${round + 1}. Runde`
        : "Dieser Abschnitt",
    sections: [
      { heading: "Problem und Ziel klar bestimmen", focus: "Grenzen, Zielgruppe und erwartetes Ergebnis eindeutig festzulegen" },
      { heading: "Einen vollständigen Analyserahmen aufbauen", focus: "Kontext, Ursachen, Methoden, Umsetzung und Prüfung zu trennen" },
      { heading: "Mit einer konkreten Situation beginnen", focus: "praktische Beispiele und reale Einschränkungen sichtbar zu machen" },
      { heading: "Eine umsetzbare Methode entwickeln", focus: "Grundsätze in überprüfbare Arbeitsschritte zu übersetzen" },
      { heading: "Herausforderungen der Umsetzung behandeln", focus: "Zeit, Qualität, Ressourcen und Zusammenarbeit zu berücksichtigen" },
      { heading: "Rückmeldung und Prüfung verankern", focus: "die Wirksamkeit anhand von Beobachtungen und Daten zu bewerten" },
      { heading: "Typische Fehler vermeiden", focus: "Abkürzungen zu erkennen, die Nacharbeit oder falsche Schlüsse verursachen" },
      { heading: "Dauerhaft nutzbare Fähigkeiten entwickeln", focus: "eine Einzellösung in einen stabilen Prozess und Wissensbestand zu überführen" }
    ],
    paragraphs: (topic, focus, continuation) => [
      `${continuation} konzentriert sich darauf, ${focus}. Eine hilfreiche Auseinandersetzung mit „${topic}“ darf nicht bei einer Schlussfolgerung stehen bleiben. Sie muss erklären, unter welchen Bedingungen diese gilt, in welchen Situationen sie anwendbar ist und welche Veränderungen während der Umsetzung auftreten können. Abstrakte Aussagen werden erst durch konkrete Aufgaben, nachvollziehbare Schritte und eindeutige Prüfkriterien nützlich.`,
      `In der Praxis kann dieselbe Methode je nach Teamgröße, Erfahrung, Zeitrahmen, verfügbaren Ressourcen und gewünschtem Ergebnis sehr unterschiedlich wirken. Deshalb müssen sowohl die ideale Richtung als auch die aktuellen Einschränkungen berücksichtigt werden. Das Ideal zeigt das Ziel, während die Rahmenbedingungen den sinnvollsten nächsten Schritt bestimmen. Diese Verbindung verhindert, dass die Darstellung zu einer bloßen Parole oder zu einer starren Vorlage wird.`,
      `Ein verlässlicher Einstieg ist ein kleiner, überprüfbarer Kreislauf. Das Ziel wird in klare Schritte zerlegt; für jeden Schritt werden Eingabe, Ergebnis und Erfolgskriterium festgelegt. Fehlen Informationen, werden sie ergänzt. Weicht das Ergebnis von der Erwartung ab, wird zuerst die Annahme geprüft, bevor die Lösung ausgeweitet wird. Dadurch sinkt der Aufwand für Nacharbeit und Verbesserungen beruhen auf Belegen statt auf Vermutungen.`,
      `Langfristig wird ${focus} zu mehr als einer einzelnen Technik. Die Dokumentation wirksamer Entscheidungen, gescheiterter Versuche und veränderter Bedingungen schafft einen wiederverwendbaren Wissensbestand. Bei ähnlichen Aufgaben können bewährte Teile übernommen werden, während Aufmerksamkeit für jene Aspekte bleibt, die tatsächlich Urteilskraft und Kreativität verlangen.`
    ]
  }
};

export function getLocalizedArticleTopic(
  language: SupportedPageLanguage,
  instruction: string
) {
  const normalized = instruction.replace(/\s+/g, " ").trim().slice(0, 100);
  return normalized && languageMatchesText(language, normalized)
    ? normalized
    : ARTICLE_LOCALES[language].fallbackTopic;
}

export function buildLocalizedArticle({
  language,
  topic,
  targetLength,
  seed = ""
}: {
  language: SupportedPageLanguage;
  topic: string;
  targetLength: number;
  seed?: string;
}) {
  const locale = ARTICLE_LOCALES[language];
  let article = seed.trim() || locale.introduction(topic);
  let sectionIndex = 0;

  while (article.length < targetLength) {
    const section = locale.sections[sectionIndex % locale.sections.length]!;
    const round = Math.floor(sectionIndex / locale.sections.length);
    const paragraphs = locale.paragraphs(
      topic,
      section.focus,
      locale.continuation(round)
    );
    article += `\n\n## ${sectionIndex + 1}. ${section.heading}\n\n${paragraphs.join(
      "\n\n"
    )}`;
    sectionIndex += 1;
  }

  return article.slice(0, targetLength).trim();
}
