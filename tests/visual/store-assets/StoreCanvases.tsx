import {
  Check,
  FileCheck2,
  Languages,
  ScanText,
  ShieldCheck
} from "lucide-react";
import { BrowserScene } from "./BrowserScene";
import { StoreBrandLockup, StoreBrandMark } from "./Brand";
import { CompactAgentCard } from "./FillinPanel";
import {
  BRAND_TAGLINES,
  PROMO_COPY,
  SCREENSHOT_STORIES
} from "./content";
import type { ScreenshotAsset, StoreLocale } from "./types";

export function ScreenshotCanvas({
  name,
  locale
}: {
  name: ScreenshotAsset;
  locale: StoreLocale;
}) {
  const story = SCREENSHOT_STORIES[locale][name];
  return (
    <div className={`store-canvas screenshot-canvas locale-${locale}`}>
      <div className="screenshot-accent" />
      <div className="decor-ring ring-top" />
      <div className="decor-ring ring-bottom" />

      <section className="story-copy">
        <StoreBrandLockup tagline={BRAND_TAGLINES[locale]} />
        <div className="story-eyebrow">{story.eyebrow}</div>
        <h1>{story.title}</h1>
        <p>{story.description}</p>
        <ul>
          {story.points.map((point) => (
            <li key={point}>
              <span>
                <Check size={13} strokeWidth={2.6} />
              </span>
              {point}
            </li>
          ))}
        </ul>
      </section>

      <div className="story-browser">
        <BrowserScene view={story.view} locale={locale} />
      </div>
    </div>
  );
}

export function SmallPromo({ locale }: { locale: StoreLocale }) {
  const copy = PROMO_COPY[locale];
  return (
    <div className={`store-canvas promo-small locale-${locale}`}>
      <div className="promo-orbit orbit-one" />
      <div className="promo-orbit orbit-two" />
      <section>
        <StoreBrandMark size={42} framed />
        <h1>Fillin</h1>
        <p>{copy.smallTagline}</p>
        <div className="promo-mini-features">
          {copy.smallFeatures.map((feature, index) => (
            <span key={feature}>
              {index > 0 && <i />}
              {feature}
            </span>
          ))}
        </div>
      </section>
      <div className="small-panel-preview">
        <BrowserScene view="comment" locale={locale} compact />
      </div>
    </div>
  );
}

export function MarqueePromo({ locale }: { locale: StoreLocale }) {
  const copy = PROMO_COPY[locale];
  const featureIcons = [ScanText, Languages, FileCheck2];

  return (
    <div className={`store-canvas promo-marquee locale-${locale}`}>
      <div className="promo-divider" />
      <div className="promo-orbit marquee-one" />
      <div className="promo-orbit marquee-two" />
      <section className="marquee-copy">
        <div className="marquee-brand">
          <StoreBrandMark size={42} framed />
          <span>{copy.marqueeLabel}</span>
        </div>
        <h1>{copy.marqueeTitle}</h1>
        <p>{copy.marqueeDescription}</p>
        <div className="marquee-features">
          {copy.marqueeFeatures.map((label, index) => {
            const Icon = featureIcons[index];
            return (
              <span key={label}>
                <Icon size={14} />
                {label}
              </span>
            );
          })}
        </div>
        <div className="privacy-pill">
          <ShieldCheck size={15} />
          {copy.privacy}
        </div>
      </section>
      <div className="marquee-browser">
        <BrowserScene view="form" locale={locale} />
      </div>
      <div className="marquee-agent">
        <CompactAgentCard locale={locale} />
      </div>
    </div>
  );
}
