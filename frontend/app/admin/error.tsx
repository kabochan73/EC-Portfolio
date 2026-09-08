"use client";

// /admin 配下でレンダリング中にエラーが出たときの境界。
export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-start justify-center gap-4 px-2">
      <p className="text-xs tracking-[0.2em] text-graphite uppercase">Something went wrong</p>
      <p className="text-sm text-graphite">
        データを読み込めませんでした。しばらくしてからもう一度お試しください。
      </p>
      <button
        onClick={reset}
        className="border border-ink px-6 py-3 text-xs tracking-[0.2em] uppercase transition-colors hover:bg-mist"
      >
        Retry
      </button>
    </div>
  );
}
