import type {
  FieldDescriptor,
  FillSuggestion,
  LengthGuidance,
  PageObservation
} from "../shared/types";
import {
  buildLongArticleFallback,
  getArticleTitleLengthGuidance,
  getLongArticleLengthGuidance,
  isArticleBodyField,
  isArticleTitleField
} from "./articleGeneration";
import {
  inferFieldTaskRole,
  needsContextualRewrite
} from "./fieldTaskPlanner";
import {
  detectPageLanguage,
  languageMatchesText,
  type SupportedPageLanguage
} from "./pageLanguage";
import { getSyntheticLocale } from "./syntheticLocale";

const LETTERS = "abcdefghijklmnopqrstuvwxyz";
const ALPHANUMERIC =
  "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const GENERIC_COMMENT_PATTERN =
  /这是由\s*Fillin|随机测试数据|围绕[“"]?当前主题|写得很好|很有启发|受益匪浅/i;

function randomInt(min: number, max: number): number {
  const lower = Math.ceil(Math.min(min, max));
  const upper = Math.floor(Math.max(min, max));
  const range = upper - lower + 1;
  if (range <= 1) return lower;

  const randomValues = new Uint32Array(1);
  globalThis.crypto.getRandomValues(randomValues);
  return lower + (randomValues[0] % range);
}

function randomCharacters(length: number, alphabet = ALPHANUMERIC): string {
  return Array.from(
    { length },
    () => alphabet[randomInt(0, alphabet.length - 1)]
  ).join("");
}

function randomDigits(length: number): string {
  return Array.from({ length }, () => randomInt(0, 9)).join("");
}

function getTextContext(field: FieldDescriptor): string {
  return [
    field.label,
    field.name,
    field.placeholder,
    field.context
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getMaximumLength(field: FieldDescriptor): number {
  return field.maxLength && field.maxLength > 0
    ? Math.min(field.maxLength, 16000)
    : 16000;
}

function fitTextToField(
  value: string,
  field: FieldDescriptor,
  filler = "示例"
): string {
  const maximum = getMaximumLength(field);
  const minimum = Math.min(
    maximum,
    Math.max(0, field.minLength || 0)
  );
  let result = value;

  while (result.length < minimum) {
    result += filler;
  }

  return result.slice(0, maximum);
}

function getTargetLength(
  field: FieldDescriptor,
  guidance?: LengthGuidance
): number {
  const maximum = getMaximumLength(field);
  const minimum = Math.min(maximum, Math.max(1, field.minLength || 1));
  const inferred =
    guidance?.target ||
    (field.visibleLines && field.visibleLines >= 12
      ? 800
      : field.visibleLines && field.visibleLines >= 4
        ? 180
        : 100);

  return Math.max(minimum, Math.min(maximum, inferred));
}

function createProse(
  field: FieldDescriptor,
  guidance: LengthGuidance | undefined,
  language: SupportedPageLanguage
): string {
  const target = getTargetLength(field, guidance);
  const locale = getSyntheticLocale(language);
  const marker =
    language === "zh"
      ? `（${randomCharacters(6)}）`
      : ` (${randomCharacters(6)})`;
  let value = "";
  let index = 0;

  while (value.length < target) {
    value += `${locale.proseSentences[index % locale.proseSentences.length]}${marker}`;
    index += 1;
  }

  return fitTextToField(
    value.slice(0, target),
    field,
    locale.minimumLengthFiller
  );
}

function getObservationSentences(observation: PageObservation) {
  return `${observation.description} ${observation.mainText}`
    .split(/(?<=[。！？!?；;])\s*/)
    .map((value) => value.replace(/\s+/g, " ").trim())
    .filter((value) => value.length >= 16 && value.length <= 140);
}

export function createContextualComment(
  field: FieldDescriptor,
  observation: PageObservation
) {
  const language = detectPageLanguage({
    declared: observation.language,
    text: `${observation.heading} ${observation.description} ${observation.mainText}`
  });
  const locale = getSyntheticLocale(language);
  const sentences = getObservationSentences(observation);
  const focus =
    sentences.find((sentence) =>
      /但|不过|然而|问题|优点|缺点|测试|案例|数据|配额|成本|效率|结果|结论|\d/i.test(
        sentence
      )
    ) ||
    sentences[0] ||
    observation.description ||
    observation.heading ||
    observation.title;
  const concretePoint = focus
    .replace(/^[：:，,\s]+|[。！？!?；;\s]+$/g, "")
    .slice(0, 72);
  const value = concretePoint
    ? locale.commentWithPoint(concretePoint)
    : locale.commentFallback;
  return fitTextToField(value, field, locale.minimumLengthFiller);
}

function getOptionValue(option: string): string {
  const separatorIndex = option.indexOf(":");
  return (separatorIndex >= 0 ? option.slice(0, separatorIndex) : option).trim();
}

function normalizeOptionValue(
  value: string,
  options: string[]
): string | undefined {
  const normalized = value.trim().toLowerCase();
  const matchingOption = options.find((option) => {
    const separatorIndex = option.indexOf(":");
    const optionValue = getOptionValue(option).toLowerCase();
    const optionLabel = (
      separatorIndex >= 0 ? option.slice(separatorIndex + 1) : option
    )
      .trim()
      .toLowerCase();
    return normalized === optionValue || normalized === optionLabel;
  });

  return matchingOption ? getOptionValue(matchingOption) : undefined;
}

function createEmail(field: FieldDescriptor): string {
  const suffix = "@example.com";
  const maximum = getMaximumLength(field);
  const minimum = Math.min(maximum, Math.max(field.minLength || 0, 20));
  const availableLocalLength = Math.max(1, maximum - suffix.length);
  let localPart = `fillin.${randomCharacters(8, LETTERS + "0123456789")}`.slice(
    0,
    availableLocalLength
  );

  while (
    localPart.length + suffix.length < minimum &&
    localPart.length < availableLocalLength
  ) {
    localPart += randomCharacters(1, LETTERS + "0123456789");
  }

  return `${localPart}${suffix}`.slice(0, maximum);
}

function createPassword(field: FieldDescriptor): string {
  const maximum = getMaximumLength(field);
  const length = Math.max(
    1,
    Math.min(maximum, Math.max(field.minLength || 0, 16))
  );
  const requiredPrefix = length >= 4 ? "Aa7_" : "";
  return `${requiredPrefix}${randomCharacters(length - requiredPrefix.length)}`;
}

function createNumber(field: FieldDescriptor): string {
  const context = getTextContext(field);
  const parsedMinimum = Number(field.minValue);
  const parsedMaximum = Number(field.maxValue);
  const defaultMinimum = /age|年龄/.test(context) ? 18 : 1;
  const defaultMaximum = /age|年龄/.test(context) ? 60 : 100;
  const minimum = Number.isFinite(parsedMinimum)
    ? parsedMinimum
    : defaultMinimum;
  const maximum = Number.isFinite(parsedMaximum)
    ? parsedMaximum
    : defaultMaximum;
  const parsedStep = Number(field.step);
  if (Number.isFinite(parsedStep) && parsedStep > 0) {
    const stepCount = Math.max(0, Math.floor((maximum - minimum) / parsedStep));
    const value = minimum + randomInt(0, stepCount) * parsedStep;
    return String(Number(value.toFixed(10)));
  }
  return String(randomInt(minimum, maximum));
}

function createDate(field: FieldDescriptor): string {
  const context = getTextContext(field);
  const isBirthDate = /birth|birthday|出生|生日/.test(context);
  const defaultMinimum = Date.UTC(
    isBirthDate ? 1985 : new Date().getFullYear(),
    0,
    1
  );
  const defaultMaximum = Date.UTC(
    isBirthDate ? 2002 : new Date().getFullYear(),
    11,
    28
  );
  const parsedMinimum = field.minValue
    ? Date.parse(field.minValue)
    : Number.NaN;
  const parsedMaximum = field.maxValue
    ? Date.parse(field.maxValue)
    : Number.NaN;
  const minimum = Number.isFinite(parsedMinimum)
    ? parsedMinimum
    : defaultMinimum;
  const maximum = Number.isFinite(parsedMaximum)
    ? parsedMaximum
    : defaultMaximum;
  const dayCount = Math.max(
    0,
    Math.floor((maximum - minimum) / 86_400_000)
  );
  return new Date(minimum + randomInt(0, dayCount) * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

function createTextValue(
  field: FieldDescriptor,
  guidance: LengthGuidance | undefined,
  language: SupportedPageLanguage
): string {
  const context = getTextContext(field);
  const locale = getSyntheticLocale(language);
  let value: string;

  if (
    /article.?title|headline|文章标题|标题|主题|subject|überschrift|titel|betreff/.test(
      context
    )
  ) {
    value =
      locale.articleTitles[randomInt(0, locale.articleTitles.length - 1)];
    const target = getTargetLength(field, guidance);
    if (value.length > target) value = value.slice(0, target);
  } else if (
    /user.?name|用户名|账号|昵称|handle|benutzername/.test(context)
  ) {
    value = `fillin_${randomCharacters(8, LETTERS + "0123456789")}`;
  } else if (/first.?name|given.?name|名\b|vorname/.test(context)) {
    value = locale.firstName;
  } else if (
    /last.?name|family.?name|surname|姓\b|nachname|familienname/.test(context)
  ) {
    value = locale.lastName;
  } else if (
    /full.?name|姓名|联系人|contact.?name|vollständiger.?name/.test(context)
  ) {
    value = `${locale.fullNamePrefix} ${randomDigits(4)}`;
  } else if (
    /company|organization|organisation|公司|单位|组织|unternehmen|firma/.test(
      context
    )
  ) {
    value = `${locale.companyPrefix}-${randomCharacters(4)}`;
  } else if (
    /job|position|role|job.?title|职位|职业|岗位|beruf|stelle|funktion/.test(
      context
    )
  ) {
    value = locale.jobTitle;
  } else if (
    /address|street|地址|住址|adresse|straße|strasse/.test(context)
  ) {
    value = `${locale.streetPrefix} ${randomInt(1, 999)}${
      locale.streetSuffix ? ` ${locale.streetSuffix}` : ""
    }`;
  } else if (/city|城市|stadt|wohnort/.test(context)) {
    value = locale.city;
  } else if (
    /province|state|省份|地区|region|bundesland/.test(context)
  ) {
    value = locale.region;
  } else if (/country|国家|land/.test(context)) {
    value = locale.country;
  } else if (/zip|postal|邮编|postleitzahl|plz/.test(context)) {
    value = language === "en" ? "SW1A 1AA" : language === "de" ? "10115" : "200000";
  } else if (
    /id.?number|passport|证件|身份证|ausweis|reisepass/.test(context)
  ) {
    value = `TEST-${randomCharacters(10).toUpperCase()}`;
  } else {
    value = `${locale.testDataPrefix}-${randomCharacters(8)}`;
  }

  return fitTextToField(value, field);
}

function createUnvalidatedSyntheticValue(
  field: FieldDescriptor,
  guidance: LengthGuidance | undefined,
  language: SupportedPageLanguage
): string {
  const locale = getSyntheticLocale(language);
  switch (field.kind) {
    case "email":
      return createEmail(field);
    case "tel":
      return fitTextToField(`${locale.phonePrefix}${randomDigits(5)}`, field, "0");
    case "url":
      return fitTextToField(
        `https://example.com/u/${randomCharacters(8)}`,
        field
      );
    case "number":
    case "range":
      return createNumber(field);
    case "date":
      return createDate(field);
    case "time":
      return `${String(randomInt(8, 18)).padStart(2, "0")}:${String(
        randomInt(0, 59)
      ).padStart(2, "0")}`;
    case "month":
      return `${new Date().getFullYear()}-${String(randomInt(1, 12)).padStart(
        2,
        "0"
      )}`;
    case "week":
      return `${new Date().getFullYear()}-W${String(randomInt(1, 52)).padStart(
        2,
        "0"
      )}`;
    case "datetime-local":
      return `${createDate(field)}T${String(randomInt(8, 18)).padStart(
        2,
        "0"
      )}:${String(randomInt(0, 59)).padStart(2, "0")}`;
    case "color":
      return `#${randomCharacters(6, "0123456789abcdef")}`;
    case "password":
      return createPassword(field);
    case "select":
    case "radio":
      return field.options.length
        ? getOptionValue(field.options[randomInt(0, field.options.length - 1)])
        : `${locale.testOptionPrefix}-${randomCharacters(4)}`;
    case "checkbox": {
      const context = getTextContext(field);
      return /terms|consent|agreement|privacy|policy|条款|协议|同意|授权|声明/.test(
        context
      )
        ? "false"
        : "true";
    }
    case "textarea":
    case "contenteditable":
      return createProse(field, guidance, language);
    default:
      return createTextValue(field, guidance, language);
  }
}

function createPatternValue(
  field: FieldDescriptor,
  initialValue: string
): string {
  if (!field.pattern) return initialValue;

  let pattern: RegExp;
  try {
    pattern = new RegExp(`^(?:${field.pattern})$`, "u");
  } catch {
    return initialValue;
  }
  if (pattern.test(initialValue)) return initialValue;

  const quantifier = field.pattern.match(/\{(\d+)(?:,(\d*))?\}/);
  const quantifierMinimum = quantifier?.[1]
    ? Number(quantifier[1])
    : field.minLength || 1;
  const quantifierMaximum = quantifier?.[2]
    ? Number(quantifier[2])
    : quantifierMinimum;
  const minimum = Math.max(1, field.minLength || quantifierMinimum);
  const maximum = Math.max(
    minimum,
    Math.min(getMaximumLength(field), quantifierMaximum || minimum, 128)
  );
  const alphabets = [
    "0123456789",
    LETTERS,
    LETTERS.toUpperCase(),
    `${LETTERS}${LETTERS.toUpperCase()}0123456789`,
    `${LETTERS}${LETTERS.toUpperCase()}0123456789_-.`
  ];

  for (let attempt = 0; attempt < 120; attempt += 1) {
    const alphabet = alphabets[attempt % alphabets.length];
    const candidate = randomCharacters(
      randomInt(minimum, maximum),
      alphabet
    );
    if (pattern.test(candidate)) return candidate;
  }

  return initialValue;
}

function createSyntheticValue(
  field: FieldDescriptor,
  guidance: LengthGuidance | undefined,
  language: SupportedPageLanguage
): string {
  return createPatternValue(
    field,
    createUnvalidatedSyntheticValue(field, guidance, language)
  );
}

function normalizeAIValue(
  field: FieldDescriptor,
  suggestion: FillSuggestion
): string | undefined {
  if (!suggestion.value.trim() || field.kind === "password") return undefined;

  if (field.kind === "select" || field.kind === "radio") {
    return normalizeOptionValue(suggestion.value, field.options);
  }
  if (field.kind === "checkbox") {
    const normalized = suggestion.value.trim().toLowerCase();
    return ["true", "1", "yes", "是", "checked"].includes(normalized)
      ? "true"
      : ["false", "0", "no", "否", "unchecked"].includes(normalized)
        ? "false"
        : undefined;
  }

  return suggestion.value.trim().slice(0, getMaximumLength(field));
}

export function hasCurrentFieldValue(field: FieldDescriptor): boolean {
  return field.hasCurrentValue ?? Boolean(field.currentValue.trim());
}

export function completeFillSuggestions(
  fields: FieldDescriptor[],
  suggestions: FillSuggestion[],
  instruction = "",
  observation?: PageObservation
): FillSuggestion[] {
  const suggestionsById = new Map(
    suggestions.map((suggestion) => [suggestion.fieldId, suggestion])
  );

  return fields.map((field) => {
    const generationLanguage = detectPageLanguage({
      declared: observation?.language,
      text: observation
        ? `${observation.heading} ${observation.description} ${observation.mainText}`
        : `${field.label} ${field.name} ${field.placeholder} ${field.context || ""}`
    });
    const suggestion = suggestionsById.get(field.id);
    const articleTitleField = isArticleTitleField(field, suggestion);
    const articleTitleGuidance = articleTitleField
      ? getArticleTitleLengthGuidance(field)
      : undefined;
    const articleField = isArticleBodyField(field, suggestion);
    const articleGuidance = articleField
      ? getLongArticleLengthGuidance(field)
      : undefined;
    const publicComment = inferFieldTaskRole(field) === "public_comment";
    const contextualRewrite = needsContextualRewrite(field);
    const contextualComment = observation
      ? createContextualComment(field, observation)
      : undefined;
    const normalizedComment =
      suggestion &&
      !GENERIC_COMMENT_PATTERN.test(suggestion.value) &&
      languageMatchesText(generationLanguage, suggestion.value) &&
      suggestion.value.trim().length >= 20
        ? normalizeAIValue(field, suggestion)
        : undefined;

    if (contextualRewrite) {
      return {
        fieldId: field.id,
        value:
          (publicComment && normalizedComment) ||
          contextualComment ||
          createProse(
            field,
            suggestion?.lengthGuidance,
            generationLanguage
          ),
        action: "replace",
        confidence: normalizedComment ? suggestion?.confidence || "medium" : "medium",
        businessMeaning: suggestion?.businessMeaning || "文章评论",
        semanticType: "public_comment",
        lengthGuidance: suggestion?.lengthGuidance,
        reason: normalizedComment
          ? suggestion?.reason
          : "原内容是无关的测试模板，已依据文章语境重新生成"
      };
    }
    if (hasCurrentFieldValue(field)) {
      if (
        articleGuidance &&
        suggestion?.action === "replace" &&
        suggestion.value.trim()
      ) {
        const replacement = suggestion.value.trim();
        return {
          ...suggestion,
          value:
            replacement.length >= articleGuidance.min
                ? replacement
              : buildLongArticleFallback({
                  field,
                  instruction,
                  seed: replacement,
                  language: generationLanguage
                }),
          lengthGuidance: articleGuidance
        };
      }
      return (
        suggestion || {
          fieldId: field.id,
          value: "",
          action: "skip",
          confidence: "high",
          businessMeaning: field.label,
          semanticType: "existing",
          reason: "字段已有内容"
        }
      );
    }

    let normalizedAIValue = suggestion
      ? normalizeAIValue(field, suggestion)
      : undefined;
    if (publicComment) normalizedAIValue = normalizedComment;
    if (
      normalizedAIValue &&
      (articleField ||
        articleTitleField ||
        field.kind === "textarea" ||
        field.kind === "contenteditable") &&
      !languageMatchesText(generationLanguage, normalizedAIValue)
    ) {
      normalizedAIValue = undefined;
    }
    if (
      articleTitleGuidance &&
      normalizedAIValue &&
      (normalizedAIValue.length > articleTitleGuidance.max ||
        /[\r\n]/.test(normalizedAIValue))
    ) {
      normalizedAIValue = undefined;
    }
    if (
      suggestion &&
      normalizedAIValue &&
      (!articleGuidance || normalizedAIValue.length >= articleGuidance.min)
    ) {
      return {
        ...suggestion,
        value: normalizedAIValue,
        action: "fill",
        lengthGuidance:
          articleGuidance ||
          articleTitleGuidance ||
          suggestion.lengthGuidance
      };
    }

    return {
      fieldId: field.id,
      value: articleField
        ? buildLongArticleFallback({
            field,
            instruction,
            seed: normalizedAIValue,
            language: generationLanguage
          })
        : publicComment && contextualComment
          ? contextualComment
        : createSyntheticValue(
            field,
            articleTitleGuidance || suggestion?.lengthGuidance,
            generationLanguage
          ),
      action: "fill",
      confidence: "medium",
      businessMeaning: suggestion?.businessMeaning || field.label,
      semanticType:
        articleTitleField
          ? "article_title"
          : publicComment
            ? "public_comment"
            : suggestion?.semanticType || (articleField ? "long_form" : "synthetic"),
      lengthGuidance:
        articleGuidance ||
        articleTitleGuidance ||
        suggestion?.lengthGuidance,
      reason: articleField
        ? "AI 文章长度不足，已扩展为完整长文"
        : publicComment
          ? "AI 未提供可用评论，已依据当前文章内容生成"
        : "AI 未提供可用内容，已使用本地随机数据补全"
    };
  });
}
