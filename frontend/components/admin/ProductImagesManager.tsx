"use client";

import { useRef, useState } from "react";

import type { ApiResource, ProductImage } from "@/lib/types";

type Props = {
  productId: number;
  initialImages: ProductImage[];
};

/**
 * 商品画像の管理（アップロード・並べ替え・削除。docs/05-admin.md）。
 * position 0 が主画像・1 がホバー画像。一覧を返す GET は無いので、
 * ミューテーション後は商品詳細を取り直して images だけ差し替える。
 */
export default function ProductImagesManager({ productId, initialImages }: Props) {
  const [images, setImages] = useState(initialImages);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function refetch() {
    const res = await fetch(`/bff/admin/products/${productId}`);
    if (res.ok) {
      const body: ApiResource<{ images: ProductImage[] }> = await res.json();
      setImages(body.data.images);
    }
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(`/bff/admin/products/${productId}/images`, {
      method: "POST",
      body: formData,
    });
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.message ?? "アップロードに失敗しました。");
      return;
    }
    await refetch();
  }

  async function handleDelete(image: ProductImage) {
    if (!window.confirm("この画像を削除しますか？")) return;
    setError(null);
    const res = await fetch(`/bff/admin/product-images/${image.id}?product=${productId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.message ?? "削除に失敗しました。");
      return;
    }
    await refetch();
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;

    const reordered = [...images];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

    setError(null);
    const res = await fetch(`/bff/admin/products/${productId}/images/reorder`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: reordered.map((img) => img.id) }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.message ?? "並べ替えに失敗しました。");
      return;
    }
    await refetch();
  }

  return (
    <div>
      <h2 className="mb-4 text-[11px] tracking-widest text-graphite uppercase">Images</h2>
      {error && <p className="mb-4 text-xs text-graphite">{error}</p>}

      {images.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {images.map((image, index) => (
            <div key={image.id} className="border border-ink p-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- 管理プレビューのみ。next/image 最適化は不要 */}
              <img
                src={image.url}
                alt={image.alt ?? ""}
                className="aspect-square w-full bg-mist object-cover"
              />
              <p className="mt-2 text-[11px] text-graphite uppercase">
                {index === 0 ? "Primary" : index === 1 ? "Hover" : `#${index + 1}`}
              </p>
              <div className="mt-1 flex items-center justify-between text-xs">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleMove(index, -1)}
                    disabled={index === 0}
                    className="disabled:opacity-30"
                    aria-label="前へ"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(index, 1)}
                    disabled={index === images.length - 1}
                    className="disabled:opacity-30"
                    aria-label="後ろへ"
                  >
                    ▼
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(image)}
                  className="text-graphite underline underline-offset-2 hover:text-ink"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <label className="inline-block cursor-pointer border border-ink px-6 py-3 text-xs tracking-widest uppercase transition-colors hover:bg-mist">
        {uploading ? "Uploading..." : "Upload Image"}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
        />
      </label>
    </div>
  );
}
