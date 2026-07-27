import ReactDOM from "react-dom/client";
import {
  MarqueePromo,
  ScreenshotCanvas,
  SmallPromo
} from "./store-assets/StoreCanvases";
import type {
  AssetName,
  ScreenshotAsset,
  StoreLocale
} from "./store-assets/types";
import "./store-assets/styles.css";

const asset = (
  new URLSearchParams(window.location.search).get("asset") ||
  "screenshot-fill"
) as AssetName;
const locale = (
  new URLSearchParams(window.location.search).get("locale") === "zh-CN"
    ? "zh-CN"
    : "en"
) as StoreLocale;

document.documentElement.style.cursor = "none";
document.body.style.cursor = "none";
document.documentElement.lang = locale;

function StoreAsset() {
  if (asset === "promo-small") return <SmallPromo locale={locale} />;
  if (asset === "promo-marquee") return <MarqueePromo locale={locale} />;
  return (
    <ScreenshotCanvas
      name={asset as ScreenshotAsset}
      locale={locale}
    />
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<StoreAsset />);
