# Fillin Privacy Policy

Last updated: July 27, 2026

Fillin is a browser extension that helps users complete forms. It does not operate a developer-controlled server and does not sell data, use data for advertising, or run analytics.

## Data stored on the device

Fillin stores the following data in `chrome.storage.local`:

- The AI API endpoint, model name, and API key entered by the user.
- Optional profile information that the user chooses to reuse in forms.

This data remains on the current device unless the user starts a fill task or exports a settings backup. Chrome removes extension storage when Fillin is uninstalled.

The optional backup file is an unencrypted JSON file and includes the API key. Fillin creates it only after an explicit user action.

## Data processed during a fill task

When the user starts a fill task, Fillin may read:

- The active page URL, title, visible text, and language.
- Fillable field labels, values, options, constraints, and nearby context.
- The task instruction entered by the user.
- Optional profile information saved by the user.

Existing password values are not read or transmitted. File contents, hidden fields, cookies, browsing history, and form submissions are not collected.

## Data sent to third-party AI services

If AI is configured, Fillin sends the task data described above directly from the browser to the OpenAI-compatible endpoint chosen by the user. The API key is sent only to that endpoint for authentication. Fillin does not receive or proxy these requests.

The selected AI provider processes data under its own terms and privacy policy. Users should review those policies before connecting a service. Remote endpoints must use HTTPS; unencrypted HTTP is allowed only for local services on `localhost` or `127.0.0.1`.

When AI is not configured or does not return usable values, Fillin can generate synthetic fallback values locally without sending the form to an AI service.

## Data sharing and retention

Fillin does not share data with the developer, advertisers, data brokers, or analytics providers. Data sent to the user-selected AI provider may be retained by that provider according to its policies and account settings.

Fillin does not automatically submit forms. Users can review, edit, undo, or discard generated values before submitting a page themselves.

## User controls

Users can:

- Edit or remove saved configuration and profile data in Fillin settings.
- Export or import a local settings backup.
- Remove all locally stored data by uninstalling the extension.
- Avoid third-party processing by leaving AI unconfigured and using local fallback generation.

## Changes

Material changes to this policy will be documented in the repository and reflected in the policy linked from the Chrome Web Store listing.

## Contact

For privacy questions, use the maintainer contact published with the repository or Chrome Web Store publisher profile. Security vulnerabilities should be reported using the private process in [SECURITY.md](SECURITY.md).
