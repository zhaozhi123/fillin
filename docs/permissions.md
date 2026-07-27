# Chrome Permission Rationale

Fillin requests only the permissions needed for its single purpose: reading user-visible form context, writing values after an explicit user action, and showing the workflow in Chrome's Side Panel.

## `storage`

Stores the user-configured AI endpoint, model, API key, optional profile, consent state, and undo metadata in `chrome.storage.local`.

## `sidePanel`

Displays Fillin beside the active webpage and lets the user review progress without covering the form.

## `scripting`

Runs Fillin's field scanner and writer in the active tab when the content script needs to be restored, and coordinates scans and verified writes across frames.

## Host access: `<all_urls>`

Fillin is a general-purpose form filler, so it must work on websites selected by the user rather than on a fixed domain list. Host access is used to:

- Discover and write fillable fields on the current page and its frames.
- Read the current page URL, title, visible context, and field metadata.
- Connect directly to the OpenAI-compatible endpoint configured by the user.

Fillin does not run on restricted Chrome pages. It does not collect browsing history, cookies, hidden fields, file contents, or existing passwords.

## Permissions intentionally not requested

- No `history`, `cookies`, `downloads`, `identity`, `clipboardRead`, or `webRequest`.
- No `activeTab` or `tabs` permission; matching host access provides the page metadata required by the active workflow.
- No permission to submit forms on the user's behalf.

Any pull request that adds or broadens a permission must update this document, the privacy policy, and the Chrome Web Store disclosures.
