// トップページ。Step 34 で CMS 駆動（Hero / Concept / Lookbook / CategoryGrid / About）に置き換える。
// いまは共通レイアウト（Header / Footer）の動作確認用の最小プレースホルダ。
export default function HomePage() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-6xl flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-medium tracking-[0.25em] uppercase sm:text-4xl">
        EC-PORTFOLIO
      </h1>
      <p className="mt-4 text-xs tracking-[0.15em] text-graphite uppercase">
        Everyday garments, considered.
      </p>
    </section>
  );
}
