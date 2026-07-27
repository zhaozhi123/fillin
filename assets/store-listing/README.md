# Fillin Chrome Web Store Assets

The root assets are the English global/default listing. Simplified Chinese artwork lives under `locales/zh_CN/`.

## Asset inventory

| Asset | Size | Story |
| --- | ---: | --- |
| `screenshots/01-one-click-fill.png` | 1280×800 | Understand, fill, and verify a complete form |
| `screenshots/02-context-aware-comments.png` | 1280×800 | Read an article before writing a relevant comment |
| `screenshots/03-long-form-writing.png` | 1280×800 | Distinguish titles from long-form body editors |
| `screenshots/04-local-ai-settings.png` | 1280×800 | Connect a user-selected AI service with local settings |
| `promo-small.png` | 440×280 | Required small promotional tile |
| `promo-marquee.png` | 1400×560 | Optional marquee promotional tile |

Each image is an opaque 24-bit RGB PNG. Product scenes use deterministic synthetic data and fictional `.example` websites. No third-party website branding or real identity appears in the artwork.

## Localized assets

The Chinese set mirrors the English filenames:

```text
assets/store-listing/locales/zh_CN/
├── promo-marquee.png
├── promo-small.png
└── screenshots/
    ├── 01-one-click-fill.png
    ├── 02-context-aware-comments.png
    ├── 03-long-form-writing.png
    └── 04-local-ai-settings.png
```

## Reproducible visual fixtures

Start the deterministic React preview:

```bash
npm run dev:visual
```

English is the default:

- `http://localhost:5173/tests/visual/store-assets.html?asset=screenshot-fill`
- `http://localhost:5173/tests/visual/store-assets.html?asset=screenshot-context`
- `http://localhost:5173/tests/visual/store-assets.html?asset=screenshot-article`
- `http://localhost:5173/tests/visual/store-assets.html?asset=screenshot-settings`
- `http://localhost:5173/tests/visual/store-assets.html?asset=promo-small`
- `http://localhost:5173/tests/visual/store-assets.html?asset=promo-marquee`

Append `&locale=zh-CN` to render the Simplified Chinese version.

Store copy is available in [listing.en.md](listing.en.md) and [listing.zh-CN.md](listing.zh-CN.md).
