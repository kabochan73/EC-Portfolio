import Image from "next/image";

import type { SiteContent } from "@/lib/types";

/**
 * フルスクリーンのヒーロー（docs/01-sitemap-pages.md）。CMS の hero コンテンツ駆動。
 * 画像なしは bg-ink の単色背景。ヘッダーは常に不透明固定なので
 * (shop)/layout.tsx の main の pt-16 の下から始まる。
 */
export default function Hero({ hero }: { hero: SiteContent["hero"] }) {
  return (
    <section className="relative flex h-screen items-center justify-center overflow-hidden bg-ink text-paper">
      {hero.image_url && (
        <Image
          src={hero.image_url}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-70"
        />
      )}
      <div className="relative text-center">
        <p className="text-xs tracking-[0.3em] uppercase sm:text-sm">
          {hero.headline || "EC-PORTFOLIO"}
        </p>
        {hero.tagline && (
          <p className="mt-4 text-[11px] tracking-[0.2em] uppercase opacity-80">
            {hero.tagline}
          </p>
        )}
      </div>
    </section>
  );
}
