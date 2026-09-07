// (shop) 配下のページ読み込み中に出すスケルトン（docs/08 §11）。
export default function ShopLoading() {
  return (
    <div className="animate-pulse">
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-64 bg-mist" />
      </div>
      <div className="border-t border-ink px-6 py-20">
        <div className="mb-10 h-10 w-48 bg-mist" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-3/4 bg-mist" />
              <div className="mt-3 h-3 w-20 bg-mist" />
              <div className="mt-2 h-3 w-32 bg-mist" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
