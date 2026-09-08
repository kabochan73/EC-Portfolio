"use client";

import { useState } from "react";

import VariantForm from "@/components/admin/VariantForm";
import type {
  AdminProductVariant,
  ApiResource,
  CreateVariantPayload,
  UpdateVariantPayload,
} from "@/lib/types";

type Mode = { type: "idle" } | { type: "adding" } | { type: "editing"; id: number };

/**
 * バリアント（サイズ×色×在庫）の管理。ProductImagesManager と同じく、
 * 専用の一覧エンドポイントが無いので商品詳細を取り直して variants を差し替える。
 */
export default function VariantsManager({
  productId,
  initialVariants,
}: {
  productId: number;
  initialVariants: AdminProductVariant[];
}) {
  const [variants, setVariants] = useState(initialVariants);
  const [mode, setMode] = useState<Mode>({ type: "idle" });
  const [error, setError] = useState<string | null>(null);

  async function refetch() {
    const res = await fetch(`/bff/admin/products/${productId}`);
    if (res.ok) {
      const body: ApiResource<{ variants: AdminProductVariant[] }> = await res.json();
      setVariants(body.data.variants);
    }
  }

  async function send(url: string, init: RequestInit, failMessage: string): Promise<boolean> {
    setError(null);
    const res = await fetch(url, init);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.message ?? failMessage);
      return false;
    }
    return true;
  }

  async function handleCreate(payload: CreateVariantPayload | UpdateVariantPayload) {
    const ok = await send(
      `/bff/admin/products/${productId}/variants`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      "作成に失敗しました。",
    );
    if (!ok) return;
    await refetch();
    setMode({ type: "idle" });
  }

  async function handleUpdate(
    variantId: number,
    payload: CreateVariantPayload | UpdateVariantPayload,
  ) {
    const ok = await send(
      `/bff/admin/variants/${variantId}?product=${productId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      "更新に失敗しました。",
    );
    if (!ok) return;
    await refetch();
    setMode({ type: "idle" });
  }

  async function handleDelete(variant: AdminProductVariant) {
    const label = `${variant.size}${variant.color ? ` / ${variant.color}` : ""}`;
    if (!window.confirm(`${label} を削除しますか？`)) return;
    const ok = await send(
      `/bff/admin/variants/${variant.id}?product=${productId}`,
      { method: "DELETE" },
      "削除に失敗しました。",
    );
    if (!ok) return;
    await refetch();
  }

  const editing =
    mode.type === "editing" ? variants.find((v) => v.id === mode.id) : undefined;

  return (
    <div>
      <h2 className="mb-4 text-[11px] tracking-widest text-graphite uppercase">Variants</h2>
      {error && <p className="mb-4 text-xs text-graphite">{error}</p>}

      {variants.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink text-left text-[11px] tracking-widest text-graphite uppercase">
                <th className="py-2 pr-4 font-normal">Size</th>
                <th className="py-2 pr-4 font-normal">Color</th>
                <th className="py-2 pr-4 font-normal">SKU</th>
                <th className="py-2 pr-4 font-normal">Stock</th>
                <th className="py-2 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((variant) => (
                <tr key={variant.id} className="border-b border-mist">
                  <td className="py-2 pr-4">{variant.size}</td>
                  <td className="py-2 pr-4 text-graphite">{variant.color ?? "—"}</td>
                  <td className="py-2 pr-4 text-graphite">{variant.sku ?? "—"}</td>
                  <td className="py-2 pr-4">{variant.stock}</td>
                  <td className="py-2">
                    <div className="flex gap-4 text-xs tracking-widest uppercase">
                      <button
                        type="button"
                        onClick={() => setMode({ type: "editing", id: variant.id })}
                        className="underline underline-offset-2 hover:text-graphite"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(variant)}
                        className="underline underline-offset-2 hover:text-graphite"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {mode.type === "editing" && editing ? (
        <VariantForm
          initialValues={editing}
          onSubmit={(payload) => handleUpdate(editing.id, payload)}
          onCancel={() => setMode({ type: "idle" })}
        />
      ) : mode.type === "adding" ? (
        <VariantForm onSubmit={handleCreate} onCancel={() => setMode({ type: "idle" })} />
      ) : (
        <button
          type="button"
          onClick={() => setMode({ type: "adding" })}
          className="mt-6 border border-ink px-6 py-3 text-xs tracking-widest uppercase transition-colors hover:bg-mist"
        >
          Add New Variant
        </button>
      )}
    </div>
  );
}
