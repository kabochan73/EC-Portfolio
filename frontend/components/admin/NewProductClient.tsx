"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import ProductForm from "@/components/admin/ProductForm";
import type { AdminCategory, AdminProduct, AdminProductPayload, ApiResource } from "@/lib/types";

export default function NewProductClient({ categories }: { categories: AdminCategory[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(payload: AdminProductPayload) {
    setError(null);
    const res = await fetch("/bff/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.message ?? "作成に失敗しました。");
      return;
    }
    const body = (await res.json()) as ApiResource<AdminProduct>;
    router.push(`/admin/products/${body.data.id}`);
  }

  return (
    <div>
      {error && <p className="mb-6 text-xs text-graphite">{error}</p>}
      <ProductForm categories={categories} onSubmit={handleSubmit} submitLabel="Create" />
    </div>
  );
}
