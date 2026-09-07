import CategoryGrid from "@/components/home/CategoryGrid";
import { getCategories } from "@/lib/categories";
import { getProducts } from "@/lib/products";

// Hero / BrandConcept / Lookbook / AboutSection（CMS 駆動）は Step 35 で追加する。
// いまはカテゴリ別の商品セクションだけ。

export default async function HomePage() {
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);

  return (
    <div>
      <section className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-medium tracking-[0.25em] uppercase sm:text-4xl">
          EC-PORTFOLIO
        </h1>
        <p className="mt-4 text-xs tracking-[0.15em] text-graphite uppercase">
          Everyday garments, considered.
        </p>
      </section>

      <CategoryGrid categories={categories} products={products} />
    </div>
  );
}
