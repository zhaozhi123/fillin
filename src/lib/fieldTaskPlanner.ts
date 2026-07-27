import type {
  FieldDescriptor,
  FieldTaskRole,
  PageObservation
} from "../shared/types";
import {
  isArticleBodyField,
  isArticleTitleField
} from "./articleGeneration";

const NAVIGATION_PATTERN =
  /(?:^|\b)(?:search|site.?search|global.?search|find|suche|suchen|seitensuche)(?:\b|$)|搜索|搜一搜|探索稀土掘金|全站检索|站内检索/i;
const COMMENT_PATTERN =
  /comment|reply|discussion|leave.?a.?message|your.?thoughts|kommentar|antwort|diskussion|nachricht.?hinterlassen|评论|回复|留言|参与讨论|友善交流|平等表达/i;
const LEGACY_FILLER_PATTERN =
  /这是由\s*Fillin|内容使用随机测试数据|测试数据-[a-z0-9]+|围绕[“"]?当前主题|最终内容不会由\s*Fillin/i;

function getDirectFieldText(field: FieldDescriptor) {
  return [field.label, field.name, field.placeholder]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function inferFieldTaskRole(
  field: FieldDescriptor
): FieldTaskRole {
  const directText = getDirectFieldText(field);
  if (NAVIGATION_PATTERN.test(directText)) return "navigation";
  if (
    COMMENT_PATTERN.test(`${directText} ${field.context || ""}`) &&
    ["text", "textarea", "contenteditable"].includes(field.kind)
  ) {
    return "public_comment";
  }
  if (isArticleTitleField(field)) return "article_title";
  if (isArticleBodyField(field)) return "article_body";
  return "form_field";
}

function instructionExplicitlyTargetsNavigation(instruction: string) {
  return /搜索|搜一下|查找|检索|search|find|suche|suchen/i.test(instruction);
}

function instructionMentionsField(
  instruction: string,
  field: FieldDescriptor
) {
  const normalized = instruction.trim().toLowerCase();
  if (!normalized) return false;
  return [field.label, field.name, field.placeholder]
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length >= 2)
    .some((value) => normalized.includes(value));
}

export type FieldTaskPlan = {
  targetFields: FieldDescriptor[];
  skippedFields: FieldDescriptor[];
  rolesById: Map<string, FieldTaskRole>;
};

export function planFieldTask({
  fields,
  observation,
  instruction
}: {
  fields: FieldDescriptor[];
  observation: PageObservation;
  instruction: string;
}): FieldTaskPlan {
  const rolesById = new Map(
    fields.map((field) => [field.id, inferFieldTaskRole(field)])
  );
  const commentFieldIds = new Set(
    fields
      .filter((field) => rolesById.get(field.id) === "public_comment")
      .map((field) => field.id)
  );
  const focusComments =
    observation.pageType === "article" && commentFieldIds.size > 0;
  const allowNavigation = instructionExplicitlyTargetsNavigation(instruction);

  const targetFields = fields.filter((field) => {
    const role = rolesById.get(field.id);
    if (role === "navigation") {
      return allowNavigation && instructionMentionsField(instruction, field);
    }
    if (focusComments) {
      return (
        role === "public_comment" ||
        instructionMentionsField(instruction, field)
      );
    }
    return true;
  });
  const targetIds = new Set(targetFields.map((field) => field.id));

  return {
    targetFields,
    skippedFields: fields.filter((field) => !targetIds.has(field.id)),
    rolesById
  };
}

export function needsContextualRewrite(field: FieldDescriptor) {
  return (
    inferFieldTaskRole(field) === "public_comment" &&
    LEGACY_FILLER_PATTERN.test(field.currentValue)
  );
}
