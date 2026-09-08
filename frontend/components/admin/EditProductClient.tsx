"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import ProductForm from "@/components/admin/ProductForm";
import ProductImagesManager from "@/components/admin/ProductImagesManager";
import type { AdminCategory, AdminProduct, AdminProductPayload } from "@/lib/types";

type Props = {
  product: AdminProduct;
  categories: AdminCategory[];
};

/**
 * 商品編集。基本情報 + 画像管理。バリアントの管理 UI は 47c-3 で追加する。
 */
export default function EditProductClient({ product, categories }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(payload: AdminProductPayload) {
    setError(null);
    setNotice(null);
    const res = await fetch(`/bff/admin/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.message ?? "更新に失敗しました。");
      return;
    }
    setNotice("保存しました。");
    router.refresh();
  }

  async function handleDelete() {
    if (!window.confirm(`「${product.name}」を削除しますか？この操作は取り消せません。`)) return;
    const res = await fetch(`/bff/admin/products/${product.id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.message ?? "削除に失敗しました。");
      return;
    }
    router.push("/admin/products");
  }

  return (
    <div>
      {error && <p className="mb-6 text-xs text-graphite">{error}</p>}
      {notice && <p className="mb-6 text-xs text-graphite">{notice}</p>}

      <ProductForm
        categories={categories}
        initialValues={product}
        onSubmit={handleSubmit}
        submitLabel="Save"
      />

      <button
        type="button"
        onClick={handleDelete}
        className="mt-6 text-xs tracking-widest text-graphite uppercase underline underline-offset-2 hover:text-ink"
      >
        Delete Product
      </button>

      <hr className="my-10 border-mist" />

      <ProductImagesManager productId={product.id} initialImages={product.images} />
    </div>
  );
}
