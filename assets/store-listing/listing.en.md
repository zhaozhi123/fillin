# Chrome Web Store Listing — English

## Product name

Fillin — AI Form Filler

## Summary

Context-aware autofill that writes, verifies, and never submits forms for you.

## Category

Productivity

## Detailed description

Fillin helps you complete online forms without giving up control.

It reads the current page, understands what each field is for, plans appropriate content, writes values one field at a time, and checks that the page accepted them. You always review and submit the form yourself.

### Built for more than simple inputs

- Complete ordinary forms, selects, radio buttons, checkboxes, and rich-text editors.
- Generate relevant comments after reading the current article and discussion context.
- Distinguish article titles from body editors and create complete long-form drafts.
- Match generated content to the website language, including English, Chinese, and German.
- Preserve existing values unless you explicitly ask for a rewrite.
- Undo the current fill operation at any time.

### Use your own AI service

Connect OpenAI, OpenRouter, DeepSeek, or another OpenAI-compatible `/chat/completions` endpoint. Choose the model, save an optional reusable profile, and add an instruction for each task.

If AI is not configured or does not return a usable value, Fillin can generate clearly synthetic fallback data locally.

### Privacy and control

Fillin has no developer-operated backend. Your API key, model settings, and optional profile stay in `chrome.storage.local` on your device. When you start a task, relevant page fields and context are sent directly to the AI service you configured.

Fillin does not read existing passwords, collect cookies or browsing history, run analytics, or automatically submit forms.

Review the generated values before submitting any page.

## Permission rationale

- **Storage:** saves AI configuration, optional profile data, consent, and undo state locally.
- **Side panel:** shows Fillin next to the current form.
- **Scripting and website access:** discovers fields, writes values, and verifies results on the page selected by the user.

The full permission rationale and privacy policy are included in the public repository.
