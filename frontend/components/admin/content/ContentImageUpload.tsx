"use client";

import { useRef, useState } from "react";

type Props = {
  /** hero / lookbook / about のいずれか（保存先ディレクトリ） */
  contentKey: string;
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
};

/**
 * CMS 画像のアップロード + プレビュー + 削除。POST /bff/admin/content/{key}/images で
 * バケットに保存し、返ってきた /media/... URL を onChange で親に渡す（data 反映は保存時）。
 */
export default function ContentImageUpload({
  contentKey,
  value,
  onChange,
  label = "Image",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(`/bff/admin/content/${contentKey}/images`, {
      method: "POST",
      body: formData,
    });
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.message ?? "アップロードに失敗しました。");
      return;
    }
    const body = (await res.json()) as { url: string };
    onChange(body.url);
  }

  return (
    <div>
      <p className="text-[11px] tracking-widest text-graphite uppercase">{label}</p>
      {value && (
        // eslint-disable-next-line @next/next/no-img-element -- 管理プレビューのみ
        <img
          src={value}
          alt=""
          className="mt-2 max-h-40 border border-mist bg-mist object-contain"
        />
      )}
      {error && <p className="mt-2 text-xs text-graphite">{error}</p>}
      <div className="mt-2 flex items-center gap-4">
        <label className="cursor-pointer border border-ink px-4 py-2 text-[11px] tracking-widest uppercase transition-colors hover:bg-mist">
          {uploading ? "..." : value ? "Replace" : "Upload"}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            disabled={uploading}
            className="hidden"
          />
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-[11px] tracking-widest text-graphite uppercase underline underline-offset-2 hover:text-ink"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
