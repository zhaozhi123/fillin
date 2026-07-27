import {
  getDescribedText,
  getElementPlaceholder,
  getFieldContext,
  getLabel,
  getSemanticFieldName,
  getVisibleLines,
  type FillinElement
} from "./fieldMetadata";
import type { FieldKind } from "../shared/types";
import {
  getContentEditableLength,
  getHostReportedEditorLength,
  isContentEditableValueApplied,
  writeContentEditableValue
} from "./contentEditableWriter";
import { observeCurrentPage } from "./pageObserver";
import type { PageObservation } from "../shared/types";

declare global {
  interface Window {
    __fillinContentVersion?: string;
    __fillinFrameBridge?: {
      scan: () => ScanResponse;
      observe: () => PageObservation;
      fillField: (fieldId: string, value: string) => Promise<{ ok: boolean }>;
      restore: (
        values: Array<{ fieldId: string; value: string }>
      ) => Promise<{ ok: boolean }>;
      clearHighlight: () => { ok: boolean };
    };
  }
}

type ScanResponse = {
  fields: ScannedField[];
};

type ScannedField = {
  id: string;
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

const CONTENT_VERSION = "agent-loop-v1";

if (window.__fillinContentVersion !== CONTENT_VERSION) {
  window.__fillinContentVersion = CONTENT_VERSION;

  const FIELD_ATTR = "data-fillin-field-id";
  const STYLE_ID = "fillin-agent-styles";

  const ensureStyles = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      @keyframes fillin-pulse {
        0% { box-shadow: 0 0 0 0 rgba(89, 86, 214, .28); }
        55% { box-shadow: 0 0 0 7px rgba(89, 86, 214, .08); }
        100% { box-shadow: 0 0 0 0 rgba(89, 86, 214, 0); }
      }
      [data-fillin-active="true"] {
        outline: 2px solid #5b57d6 !important;
        outline-offset: 2px !important;
        animation: fillin-pulse .72s ease-out !important;
        transition: outline-color .16s ease !important;
      }
      [data-fillin-complete="true"] {
        outline: 2px solid rgba(34, 139, 94, .75) !important;
        outline-offset: 2px !important;
      }
    `;
    document.documentElement.appendChild(style);
  };

  const isVisible = (element: Element) => {
    const htmlElement = element as HTMLElement;
    const style = window.getComputedStyle(htmlElement);
    const rect = htmlElement.getBoundingClientRect();
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      Number(style.opacity) !== 0 &&
      rect.width > 0 &&
      rect.height > 0
    );
  };

  const getKind = (element: FillinElement): FieldKind => {
    if (element instanceof HTMLTextAreaElement) return "textarea";
    if (element instanceof HTMLSelectElement) return "select";
    if (element.isContentEditable) return "contenteditable";
    if (element instanceof HTMLInputElement) {
      const supported = [
        "email",
        "tel",
        "url",
        "number",
        "date",
        "time",
        "month",
        "week",
        "datetime-local",
        "color",
        "range",
        "password",
        "radio",
        "checkbox"
      ];
      return supported.includes(element.type)
        ? (element.type as FieldKind)
        : "text";
    }
    return "text";
  };

  const getValue = (element: FillinElement) => {
    if (element instanceof HTMLInputElement) {
      if (element.type === "password") return "";
      if (element.type === "checkbox") return element.checked ? "true" : "false";
      if (element.type === "radio") {
        const group = element.name
          ? Array.from(
              document.querySelectorAll<HTMLInputElement>(
                `input[type="radio"][name="${CSS.escape(element.name)}"]`
              )
            )
          : [element];
        return group.find((item) => item.checked)?.value || "";
      }
      return element.value;
    }
    if (element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
      return element.value;
    }
    return element.innerText?.trim() || element.textContent?.trim() || "";
  };

  const hasValue = (element: FillinElement) => {
    if (element instanceof HTMLInputElement && element.type === "checkbox") {
      return element.checked;
    }
    return Boolean(getValue(element).trim()) ||
      (element instanceof HTMLInputElement &&
        element.type === "password" &&
        Boolean(element.value));
  };

  const getOptions = (element: FillinElement) => {
    if (element instanceof HTMLSelectElement) {
      return Array.from(element.options)
        .filter((option) => option.value)
        .map((option) => `${option.value}: ${option.text.trim()}`)
        .slice(0, 60);
    }

    if (element instanceof HTMLInputElement && element.type === "radio" && element.name) {
      return Array.from(
        document.querySelectorAll<HTMLInputElement>(
          `input[type="radio"][name="${CSS.escape(element.name)}"]`
        )
      ).map((radio) => `${radio.value}: ${getLabel(radio)}`);
    }
    if (element instanceof HTMLInputElement && element.type === "checkbox") {
      return ["true", "false"];
    }
    return [];
  };

  const getExplicitLengthLimit = (text: string) => {
    const patterns = [
      /(?:最多|不超过|上限|限制|限)\s*[:：]?\s*(\d{1,6})\s*(?:个?字|字符|字数)?/i,
      /max(?:imum)?\s*(?:length)?\s*[:：]?\s*(\d{1,6})\s*(?:characters?)?/i,
      /(\d{1,6})\s*(?:character|characters)\s*(?:max(?:imum)?)?/i
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      const value = match?.[1] ? Number(match[1]) : 0;
      if (value > 0) return value;
    }
    return undefined;
  };

  const isEligible = (element: FillinElement) => {
    if (!isVisible(element)) return false;
    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement ||
      element instanceof HTMLSelectElement
    ) {
      if (element.disabled) return false;
      if (
        (element instanceof HTMLInputElement ||
          element instanceof HTMLTextAreaElement) &&
        element.readOnly
      ) {
        return false;
      }
      if (
        element instanceof HTMLInputElement &&
        ["hidden", "file", "submit", "button", "reset", "image"].includes(
          element.type
        )
      ) {
        return false;
      }
    }
    if (
      !(
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLSelectElement
      )
    ) {
      if (!element.isContentEditable) return false;
      const editableParent = element.parentElement?.closest(
        '[contenteditable]:not([contenteditable="false"])'
      );
      if (editableParent) return false;
    }
    return true;
  };

  const scanFields = (): ScannedField[] => {
    const candidates = Array.from(
      document.querySelectorAll<FillinElement>(
        'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]'
      )
    ).filter(isEligible);

    const seenRadioGroups = new Set<string>();
    let nextId = 1;

    return candidates.flatMap((element) => {
      if (
        element instanceof HTMLInputElement &&
        element.type === "radio" &&
        element.name
      ) {
        if (seenRadioGroups.has(element.name)) return [];
        seenRadioGroups.add(element.name);
      }

      let fieldId = element.getAttribute(FIELD_ATTR);
      if (!fieldId) {
        fieldId = `field-${Date.now().toString(36)}-${nextId++}`;
      }

      if (
        element instanceof HTMLInputElement &&
        element.type === "radio" &&
        element.name
      ) {
        document
          .querySelectorAll<HTMLInputElement>(
            `input[type="radio"][name="${CSS.escape(element.name)}"]`
          )
          .forEach((radio) => radio.setAttribute(FIELD_ATTR, fieldId));
      } else {
        element.setAttribute(FIELD_ATTR, fieldId);
      }

      const input = element as HTMLInputElement;
      const label = getLabel(element).replace(/\s+/g, " ").slice(0, 160);
      const placeholder = getElementPlaceholder(element).slice(0, 160);
      const describedText = getDescribedText(element);
      const nativeMinLength =
        (element instanceof HTMLInputElement ||
          element instanceof HTMLTextAreaElement) &&
        element.minLength > 0
          ? element.minLength
          : undefined;
      const nativeMaxLength =
        (element instanceof HTMLInputElement ||
          element instanceof HTMLTextAreaElement) &&
        element.maxLength > 0
          ? element.maxLength
          : undefined;
      const explicitMaxLength = getExplicitLengthLimit(
        `${label} ${placeholder} ${describedText}`
      );
      return [
        {
          id: fieldId,
          kind: getKind(element),
          label,
          name:
            input.name ||
            element.id ||
            getSemanticFieldName(element, label),
          placeholder,
          required:
            input.required || element.getAttribute("aria-required") === "true",
          options: getOptions(element),
          currentValue: getValue(element),
          hasCurrentValue: hasValue(element),
          minLength: nativeMinLength,
          maxLength: nativeMaxLength || explicitMaxLength,
          minValue:
            element instanceof HTMLInputElement ? element.min || undefined : undefined,
          maxValue:
            element instanceof HTMLInputElement ? element.max || undefined : undefined,
          step:
            element instanceof HTMLInputElement ? element.step || undefined : undefined,
          pattern:
            element instanceof HTMLInputElement
              ? element.pattern || undefined
              : undefined,
          visibleLines: getVisibleLines(element),
          context: getFieldContext(element)
        }
      ];
    });
  };

  const findElements = (fieldId: string) =>
    Array.from(document.querySelectorAll<FillinElement>(`[${FIELD_ATTR}]`)).filter(
      (element) => element.getAttribute(FIELD_ATTR) === fieldId
    );

  const dispatchInputEvents = (element: FillinElement) => {
    element.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText" }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    element.dispatchEvent(new FocusEvent("blur", { bubbles: true }));
  };

  const setNativeValue = async (element: FillinElement, value: string) => {
    if (element instanceof HTMLInputElement) {
      if (element.type === "checkbox") {
        element.checked = ["true", "1", "yes", "是", "checked"].includes(
          value.toLowerCase()
        );
      } else if (element.type !== "radio") {
        const setter = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          "value"
        )?.set;
        setter?.call(element, value);
      }
    } else if (element instanceof HTMLTextAreaElement) {
      const setter = Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        "value"
      )?.set;
      setter?.call(element, value);
    } else if (element instanceof HTMLSelectElement) {
      const normalizedValue = value.toLowerCase();
      const matchingOption = Array.from(element.options).find(
        (option) =>
          option.value.toLowerCase() === normalizedValue ||
          option.text.trim().toLowerCase() === normalizedValue
      );
      element.value = matchingOption?.value ?? value;
    } else if (element.isContentEditable) {
      await writeContentEditableValue(element, value);
    } else {
      element.textContent = value;
    }
    if (!element.isContentEditable) dispatchInputEvents(element);
  };

  const isValueApplied = (
    elements: FillinElement[],
    value: string
  ): boolean => {
    const primary = elements[0];
    if (!primary) return false;

    if (primary instanceof HTMLInputElement) {
      if (primary.type === "radio") {
        const normalizedValue = value.toLowerCase();
        return elements.some((element) => {
          const radio = element as HTMLInputElement;
          return (
            radio.checked &&
            (radio.value.toLowerCase() === normalizedValue ||
              getLabel(radio).toLowerCase() === normalizedValue)
          );
        });
      }
      if (primary.type === "checkbox") {
        const expectedChecked = ["true", "1", "yes", "是", "checked"].includes(
          value.toLowerCase()
        );
        return primary.checked === expectedChecked && primary.checkValidity();
      }
      return primary.value === value && primary.checkValidity();
    }
    if (
      primary instanceof HTMLTextAreaElement ||
      primary instanceof HTMLSelectElement
    ) {
      return primary.value === value && primary.checkValidity();
    }
    return isContentEditableValueApplied(primary, value);
  };

  const fillField = async (fieldId: string, value: string) => {
    ensureStyles();
    const elements = findElements(fieldId);
    if (!elements.length) throw new Error("页面上的字段已经发生变化");

    const primary = elements[0];
    primary.scrollIntoView({ behavior: "smooth", block: "center" });
    elements.forEach((element) => {
      element.removeAttribute("data-fillin-complete");
      element.setAttribute("data-fillin-active", "true");
    });

    await new Promise((resolve) => window.setTimeout(resolve, 220));

    if (primary instanceof HTMLInputElement && primary.type === "radio") {
      const normalizedValue = value.toLowerCase();
      if (!normalizedValue) {
        elements.forEach((element) => {
          (element as HTMLInputElement).checked = false;
          dispatchInputEvents(element);
        });
      } else {
        const target =
          elements.find((element) => {
            const radio = element as HTMLInputElement;
            return (
              radio.value.toLowerCase() === normalizedValue ||
              getLabel(radio).toLowerCase() === normalizedValue
            );
          }) || primary;
        (target as HTMLInputElement).checked = true;
        dispatchInputEvents(target);
      }
    } else {
      await setNativeValue(primary, value);
    }

    await new Promise((resolve) => window.setTimeout(resolve, 360));
    if (!isValueApplied(elements, value)) {
      elements.forEach((element) =>
        element.removeAttribute("data-fillin-active")
      );
      if (primary.isContentEditable) {
        const hostLength = getHostReportedEditorLength();
        throw new Error(
          hostLength === undefined
            ? `富文本写入 ${getContentEditableLength(primary)}/${value.replace(/\s+/g, "").length} 字，与目标不一致`
            : `富文本 DOM 为 ${getContentEditableLength(primary)} 字，但页面实际字数为 ${hostLength}，与目标不一致`
        );
      }
      throw new Error("字段拒绝了生成值，请检查格式限制");
    }
    elements.forEach((element) => {
      element.removeAttribute("data-fillin-active");
      element.setAttribute("data-fillin-complete", "true");
      window.setTimeout(
        () => element.removeAttribute("data-fillin-complete"),
        1400
      );
    });
    return { ok: true };
  };

  const restoreFields = async (
    values: Array<{ fieldId: string; value: string }>
  ) => {
    for (const { fieldId, value } of values) {
      await fillField(fieldId, value);
    }
    return { ok: true };
  };

  const clearHighlight = () => {
    document
      .querySelectorAll("[data-fillin-active], [data-fillin-complete]")
      .forEach((element) => {
        element.removeAttribute("data-fillin-active");
        element.removeAttribute("data-fillin-complete");
      });
    return { ok: true };
  };

  window.__fillinFrameBridge = {
    scan: () => ({ fields: scanFields() }),
    observe: observeCurrentPage,
    fillField,
    restore: restoreFields,
    clearHighlight
  };

  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request?.type === "FILLIN_SCAN") {
      sendResponse(window.__fillinFrameBridge?.scan() || { fields: [] });
      return;
    }

    if (request?.type === "FILLIN_FILL_FIELD") {
      window.__fillinFrameBridge
        ?.fillField(request.fieldId, request.value)
        .then(sendResponse)
        .catch((error: Error) => sendResponse({ ok: false, error: error.message }));
      return true;
    }

    if (request?.type === "FILLIN_RESTORE") {
      window.__fillinFrameBridge
        ?.restore(
          request.values as Array<{
            fieldId: string;
            value: string;
          }>
        )
        .then(() => sendResponse({ ok: true }))
        .catch((error: Error) => sendResponse({ ok: false, error: error.message }));
      return true;
    }

    if (request?.type === "FILLIN_CLEAR_HIGHLIGHT") {
      sendResponse(window.__fillinFrameBridge?.clearHighlight() || { ok: true });
    }
  });
}

export {};
