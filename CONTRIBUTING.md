# Contributing to Fillin

Thank you for helping improve Fillin.

## Before opening a change

- Search existing issues before creating a new one.
- Use a focused issue to describe bugs or significant feature proposals.
- Never include real API keys, private form data, or personal information in examples, screenshots, fixtures, or logs.
- Use `.example` domains and clearly synthetic identities in public test data.

## Development workflow

1. Install Node.js 20 or later.
2. Run `npm install`.
3. Create a focused branch.
4. Make the smallest change that solves the issue.
5. Add or update tests for behavioral changes.
6. Run `npm run check`.
7. Open a pull request with the problem, approach, test evidence, and screenshots for UI changes.

## Code guidelines

- Keep browser messaging, AI transport, planning, and UI rendering in their existing focused modules.
- Preserve the rule that Fillin never submits a form.
- Do not read or transmit an existing password value.
- Treat page content and saved profile information as private user data.
- Keep deterministic visual fixtures separate from production code.
- Use English for repository documentation, code comments, public fixtures, and change descriptions. Localized documents may be added alongside the English source.

## Commit and pull request scope

Prefer small, reviewable commits. Do not mix refactors with unrelated behavior changes. A pull request should explain any new permission, host access, external request, or user-data flow.

By contributing, you agree that your contribution is licensed under the repository's MIT License.
