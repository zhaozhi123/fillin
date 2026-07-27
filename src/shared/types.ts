export type FieldKind =
  | "text"
  | "email"
  | "tel"
  | "url"
  | "number"
  | "date"
  | "time"
  | "month"
  | "week"
  | "datetime-local"
  | "color"
  | "range"
  | "password"
  | "textarea"
  | "select"
  | "radio"
  | "checkbox"
  | "contenteditable";

export type FieldDescriptor = {
  id: string;
  frameId?: number;
  localId?: string;
  kind: FieldKind;
  label: string;
  name: string;
  placeholder: string;
  required: boolean;
  options: string[];
  currentValue: string;
  hasCurrentValue?: boolean;
  minLength?: number;
  maxLength?: number;
  minValue?: string;
  maxValue?: string;
  step?: string;
  pattern?: string;
  visibleLines?: number;
  context?: string;
};

export type PageType =
  | "article"
  | "article-editor"
  | "form"
  | "search"
  | "other";

export type PageObservation = {
  title: string;
  url: string;
  language: string;
  pageType: PageType;
  heading: string;
  description: string;
  mainText: string;
  sectionHeadings: string[];
  tags: string[];
  sampleComments: string[];
};

export type FieldTaskRole =
  | "navigation"
  | "public_comment"
  | "article_title"
  | "article_body"
  | "form_field";

export type LengthGuidance = {
  min: number;
  target: number;
  max: number;
  unit: "characters";
};

export type FillSuggestion = {
  fieldId: string;
  value: string;
  action: "skip" | "fill" | "replace";
  confidence: "high" | "medium" | "low";
  businessMeaning: string;
  semanticType: string;
  lengthGuidance?: LengthGuidance;
  reason?: string;
};

export type AgentField = FieldDescriptor & {
  suggestedValue?: string;
  suggestionAction?: FillSuggestion["action"];
  confidence?: FillSuggestion["confidence"];
  businessMeaning?: string;
  semanticType?: string;
  lengthGuidance?: LengthGuidance;
  taskRole?: FieldTaskRole;
  status:
    | "found"
    | "ready"
    | "filling"
    | "filled"
    | "preserved"
    | "skipped"
    | "error";
};

export type PageContext = {
  tabId: number;
  title: string;
  url: string;
  hostname: string;
  faviconUrl?: string;
};

export type AIConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
  profile: string;
  dataSharingConsent: boolean;
};

export type ScanResponse = {
  fields: FieldDescriptor[];
};

export type ContentRequest =
  | { type: "FILLIN_SCAN" }
  | { type: "FILLIN_FILL_FIELD"; fieldId: string; value: string }
  | { type: "FILLIN_RESTORE"; values: Array<{ fieldId: string; value: string }> }
  | { type: "FILLIN_CLEAR_HIGHLIGHT" };

export type RunPhase =
  | "idle"
  | "scanning"
  | "thinking"
  | "filling"
  | "verifying"
  | "complete"
  | "error";
