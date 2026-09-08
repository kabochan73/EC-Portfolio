import ConceptSection from "@/components/admin/content/ConceptSection";
import HeroSection from "@/components/admin/content/HeroSection";
import type { SiteContent } from "@/lib/types";

/**
 * トップページ CMS の編集画面（docs/11-cms.md）。
 * セクションごとに独立して保存し、BFF が revalidateTag('content') でトップに即反映する。
 * Lookbook / About は Step 48b で追加。
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
    </div>
  );
}
