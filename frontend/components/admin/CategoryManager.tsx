"use client";

import { useState } from "react";

import CategoryForm from "@/components/admin/CategoryForm";
import type { AdminCategoryFormValues } from "@/lib/schemas/adminCategory";
import type { AdminCategory, ApiCollection } from "@/lib/types";

type Mode = { type: "idle" } | { type: "adding" } | { type: "editing"; id: number };

/**
 * カテゴリ管理 CRUD 一式（一覧・追加・編集・削除・▲▼並べ替え）。
 * AddressBook と同じ方針: ミューテーション成功後に一覧をまるごと取り直す。
 */
export default function CategoryManager({ initial }: { initial: AdminCategory[] }) {
  const [categories, setCategories] = useState(initial);
  const [mode, setMode] = useState<Mode>({ type: "idle" });
  const [error, setError] = useState<string | null>(null);

  async function refetch() {
    const res = await fetch("/bff/admin/categories");
    if (res.ok) {
      const body: ApiCollection<AdminCategory> = await res.json();
      setCategories(body.data);
    }
  }

  /** fetch → 失敗ならエラー文をセットして false */
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

  async function handleCreate(values: AdminCategoryFormValues) {
    const ok = await send(
      "/bff/admin/categories",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      },
      "作成に失敗しました。",
    );
    if (!ok) return;
    await refetch();
    setMode({ type: "idle" });
  }

  async function handleUpdate(category: AdminCategory, values: AdminCategoryFormValues) {
    const ok = await send(
      `/bff/admin/categories/${category.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      },
      "更新に失敗しました。",
    );
    if (!ok) return;
    await refetch();
    setMode({ type: "idle" });
  }

  async function handleDelete(category: AdminCategory) {
    if (!window.confirm(`「${category.name}」を削除しますか？`)) return;
    const ok = await send(
      `/bff/admin/categories/${category.id}`,
      { method: "DELETE" },
      "削除に失敗しました（所属する商品が残っている可能性があります）。",
    );
    if (!ok) return;
    await refetch();
  }

  /** 現在の並び順で index と index+direction を入れ替えて reorder に送る */
  async function handleMove(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= categories.length) return;

    const reordered = [...categories];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

    const ok = await send(
      "/bff/admin/categories/reorder",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: reordered.map((c) => c.id) }),
      },
      "並べ替えに失敗しました。",
    );
    if (!ok) return;
    await refetch();
  }

  const editing =
    mode.type === "editing" ? categories.find((c) => c.id === mode.id) : undefined;

  return (
    <div>
      {error && <p className="mb-6 text-xs text-graphite">{error}</p>}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-ink text-left text-[11px] tracking-widest text-graphite uppercase">
              <th className="w-20 py-2 pr-4 font-normal">Order</th>
              <th className="py-2 pr-4 font-normal">Name</th>
              <th className="py-2 pr-4 font-normal">Slug</th>
              <th className="py-2 pr-4 font-normal">Products</th>
              <th className="py-2 font-normal">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category, index) => (
              <tr key={category.id} className="border-b border-mist">
                <td className="py-3 pr-4">
                  <div className="flex gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => handleMove(index, -1)}
                      disabled={index === 0}
                      className="disabled:opacity-30"
                      aria-label="上へ"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(index, 1)}
                      disabled={index === categories.length - 1}
                      className="disabled:opacity-30"
                      aria-label="下へ"
                    >
                      ▼
                    </button>
                  </div>
                </td>
                <td className="py-3 pr-4">{category.name}</td>
                <td className="py-3 pr-4 text-graphite">{category.slug}</td>
                <td className="py-3 pr-4 text-graphite">{category.products_count}</td>
                <td className="py-3">
                  <div className="flex gap-4 text-xs tracking-widest uppercase">
                    <button
                      type="button"
                      onClick={() => setMode({ type: "editing", id: category.id })}
                      className="underline underline-offset-2 hover:text-graphite"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(category)}
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

      {mode.type === "editing" && editing ? (
        <CategoryForm
          initialValues={editing}
          onSubmit={(values) => handleUpdate(editing, values)}
          onCancel={() => setMode({ type: "idle" })}
        />
      ) : mode.type === "adding" ? (
        <CategoryForm onSubmit={handleCreate} onCancel={() => setMode({ type: "idle" })} />
      ) : (
        <button
          type="button"
          onClick={() => setMode({ type: "adding" })}
          className="mt-6 border border-ink px-6 py-3 text-xs tracking-widest uppercase transition-colors hover:bg-mist"
        >
          Add New Category
        </button>
      )}
    </div>
  );
}
