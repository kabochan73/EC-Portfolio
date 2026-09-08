"use client";

import { useState } from "react";

import ContentImageUpload from "@/components/admin/content/ContentImageUpload";
import { lookbookSchema } from "@/lib/schemas/adminContent";
import type { SiteContent } from "@/lib/types";

type LookbookImage = SiteContent["lookbook"]["images"][number];

export default function LookbookSection({
  initial,
}: {
  initial: SiteContent["lookbook"];
}) {
  const [images, setImages] = useState<LookbookImage[]>(initial.images);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update(index: number, patch: Partial<LookbookImage>) {
    setImages((prev) => prev.map((img, i) => (i === index ? { ...img, ...patch } : img)));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    setImages((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function save() {
    setError(null);
    setNotice(null);

    const parsed = lookbookSchema.safeParse({ images });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "入力を確認してください。");
      return;
    }

    setSaving(true);
    const res = await fetch("/bff/admin/content/lookbook", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.message ?? "保存に失敗しました。");
      return;
    }
    setNotice("保存しました。");
  }

  return (
    <div className="space-y-6">
      {images.length === 0 && (
        <p className="text-xs text-graphite">画像はまだありません。</p>
      )}

      <ul className="space-y-4">
        {images.map((image, index) => (
          <li key={index} className="flex gap-4 border border-mist p-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- 管理プレビュー */}
            <img
              src={image.url}
              alt=""
              className="h-24 w-20 flex-none bg-mist object-cover"
            />
            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={image.alt}
                placeholder="alt テキスト"
                onChange={(e) => update(index, { alt: e.target.value })}
                className="w-full border-b border-ink bg-transparent py-1 text-sm outline-none"
              />
              <div className="flex gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="disabled:opacity-30"
                  aria-label="前へ"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === images.length - 1}
                  className="disabled:opacity-30"
                  aria-label="後ろへ"
                >
                  ▼
                </button>
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((_, i) => i !== index))}
                  className="tracking-widest text-graphite uppercase underline underline-offset-2 hover:text-ink"
                >
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {images.length < 12 && (
        <ContentImageUpload
          contentKey="lookbook"
          value={null}
          onChange={(url) => url && setImages((prev) => [...prev, { url, alt: "" }])}
          label="画像を追加"
        />
      )}

      {error && <p className="text-xs text-graphite">{error}</p>}
      {notice && <p className="text-xs text-graphite">{notice}</p>}

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="bg-ink px-6 py-3 text-xs tracking-widest text-paper uppercase transition-opacity hover:opacity-80 disabled:opacity-50"
      >
        {saving ? "..." : "Save Lookbook"}
      </button>
    </div>
  );
}
