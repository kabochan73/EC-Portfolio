"use client";

// (shop) 配下でレンダリング中にエラーが出たときの境界（docs/08 §11）。
export default function ShopError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="text-xs tracking-[0.2em] text-graphite uppercase">Something went wrong</p>
      <p className="mt-4 text-sm text-graphite">
        ページを読み込めませんでした。しばらくしてからもう一度お試しください。
      </p>
      <button
        onClick={reset}
        className="mt-8 border border-ink px-6 py-3 text-xs tracking-[0.2em] uppercase transition-opacity hover:opacity-60"
      >
        Retry
      </button>
    </div>
  );
}
