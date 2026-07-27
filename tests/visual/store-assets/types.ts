export type ProductView = "form" | "comment" | "article" | "settings";
export type StoreLocale = "en" | "zh-CN";

export type ScreenshotAsset =
  | "screenshot-fill"
  | "screenshot-context"
  | "screenshot-article"
  | "screenshot-settings";

export type AssetName =
  | ScreenshotAsset
  | "promo-small"
  | "promo-marquee";

export type ScreenshotStory = {
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
  view: ProductView;
};
