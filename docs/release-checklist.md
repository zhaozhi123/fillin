# Release Checklist

## Code and tests

- [ ] Update the version in `manifest.json` and `package.json`.
- [ ] Update `CHANGELOG.md`.
- [ ] Run `npm ci`.
- [ ] Run `npm run check`.
- [ ] Run `npm audit --omit=dev`.
- [ ] Load `dist` as an unpacked extension and smoke-test a normal form, a comment editor, a long-form editor, an iframe form, undo, settings backup, and local fallback mode.
- [ ] Confirm that remote HTTP endpoints are rejected and local HTTP endpoints still work.

## Privacy and permissions

- [ ] Confirm that every requested permission is documented in `docs/permissions.md`.
- [ ] Confirm that `PRIVACY.md` matches the current data flow.
- [ ] Confirm that the in-product AI disclosure appears before consent is saved.
- [ ] Verify that no API key, profile, personal data, or real user content exists in source files, screenshots, logs, or the release archive.
- [ ] Publish `PRIVACY.md` at a stable public HTTPS URL and add it to the Chrome Web Store dashboard.

## Store listing

- [ ] Use the English assets as the global/default listing.
- [ ] Add the `zh_CN` assets and copy as a localized listing.
- [ ] Upload a 128×128 icon, up to five 1280×800 screenshots, the 440×280 small promo tile, and the optional 1400×560 marquee tile.
- [ ] Confirm that screenshots contain only fictional `.example` websites and synthetic identities.
- [ ] Complete the store's data-use and permission disclosures.
- [ ] Verify the support URL, homepage/repository URL, and publisher contact.

## Package

- [ ] Build from a clean checkout.
- [ ] Confirm `_locales`, icons, `manifest.json`, and side-panel assets exist in `dist`.
- [ ] Create the upload ZIP from the contents of `dist`, not from the repository root.
- [ ] Install the ZIP/unpacked build once more before submission.
- [ ] Tag the release after the uploaded artifact has been verified.
