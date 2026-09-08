import AboutSection from "@/components/admin/content/AboutSection";
import ConceptSection from "@/components/admin/content/ConceptSection";
import HeroSection from "@/components/admin/content/HeroSection";
import LookbookSection from "@/components/admin/content/LookbookSection";
import type { SiteContent } from "@/lib/types";

/**
 * トップページ CMS の編集画面（docs/11-cms.md）。
 * セクションごとに独立して保存し、BFF が revalidateTag('content') でトップに即反映する。
 */
export default function ContentEditor({ initial }: { initial: SiteContent }) {
  return (
    <div className="max-w-2xl space-y-16">
      <section>
        <h2 className="mb-6 text-[11px] tracking-widest text-graphite uppercase">Hero</h2>
        <HeroSection initial={initial.hero} />
      </section>

      <section className="border-t border-ink pt-12">
        <h2 className="mb-6 text-[11px] tracking-widest text-graphite uppercase">Concept</h2>
        <ConceptSection initial={initial.concept} />
      </section>

      <section className="border-t border-ink pt-12">
        <h2 className="mb-6 text-[11px] tracking-widest text-graphite uppercase">Lookbook</h2>
        <LookbookSection initial={initial.lookbook} />
      </section>

      <section className="border-t border-ink pt-12">
        <h2 className="mb-6 text-[11px] tracking-widest text-graphite uppercase">About</h2>
        <AboutSection initial={initial.about} />
      </section>
    </div>
  );
}
