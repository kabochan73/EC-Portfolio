"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRef } from "react";
import { useForm } from "react-hook-form";

import SizeChartEditor, { type SizeChartEditorHandle } from "@/components/admin/SizeChartEditor";
import Field from "@/components/ui/Field";
import {
  adminProductSchema,
  type AdminProductFormValues,
} from "@/lib/schemas/adminProduct";
import type { AdminCategory, AdminProduct, AdminProductPayload } from "@/lib/types";

type Props = {
  categories: AdminCategory[];
  /** 編集時は既存商品、新規作成時は undefined */
  initialValues?: AdminProduct;
  onSubmit: (payload: AdminProductPayload) => Promise<void>;
  submitLabel?: string;
};

/**
 * 商品の追加・編集で共用する「基本情報」フォーム（docs/05-admin.md）。
 * 画像・バリアントは別コンポーネント（別ステップ）で扱う。
 */
export default function ProductForm({
  categories,
  initialValues,
  onSubmit,
  submitLabel = "Save",
}: Props) {
  const sizeChartRef = useRef<SizeChartEditorHandle>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminProductFormValues>({
    resolver: zodResolver(adminProductSchema),
    defaultValues: initialValues
      ? {
          category_id: initialValues.category_id,
          name: initialValues.name,
          slug: initialValues.slug,
          price: initialValues.price,
          description: initialValues.description,
          material: initialValues.material,
          care: initialValues.care ?? "",
          origin: initialValues.origin,
          product_code: initialValues.product_code,
          is_published: initialValues.is_published,
          position: initialValues.position,
        }
      : { is_published: false, position: 0 },
  });

  async function handleFormSubmit(values: AdminProductFormValues) {
    const sizeChart = sizeChartRef.current?.getValue() ?? null;
    await onSubmit({ ...values, care: values.care || null, size_chart: sizeChart });
  }

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      noValidate
      className="max-w-2xl space-y-6"
    >
      <div>
        <label
          htmlFor="category_id"
          className="block text-[11px] tracking-widest text-graphite uppercase"
        >
          Category
        </label>
        <select
          id="category_id"
          className="mt-2 w-full border-b border-ink bg-transparent py-2 text-sm outline-none"
          {...register("category_id")}
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {errors.category_id && (
          <p className="mt-1 text-xs text-graphite">{errors.category_id.message}</p>
        )}
      </div>

      <Field label="Name" id="name" error={errors.name?.message} {...register("name")} />
      <Field
        label="Slug（例: boxy-cotton-t-shirt）"
        id="slug"
        error={errors.slug?.message}
        {...register("slug")}
      />
      <Field
        label="Price（円）"
        id="price"
        type="number"
        error={errors.price?.message}
        {...register("price")}
      />

      <div>
        <label
          htmlFor="description"
          className="block text-[11px] tracking-widest text-graphite uppercase"
        >
          Description
        </label>
        <textarea
          id="description"
          rows={4}
          className="mt-2 w-full border border-ink bg-transparent p-2 text-sm outline-none"
          {...register("description")}
        />
        {errors.description && (
          <p className="mt-1 text-xs text-graphite">{errors.description.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="material"
          className="block text-[11px] tracking-widest text-graphite uppercase"
        >
          Material
        </label>
        <textarea
          id="material"
          rows={2}
          className="mt-2 w-full border border-ink bg-transparent p-2 text-sm outline-none"
          {...register("material")}
        />
        {errors.material && (
          <p className="mt-1 text-xs text-graphite">{errors.material.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="care"
          className="block text-[11px] tracking-widest text-graphite uppercase"
        >
          Care（任意）
        </label>
        <textarea
          id="care"
          rows={2}
          className="mt-2 w-full border border-ink bg-transparent p-2 text-sm outline-none"
          {...register("care")}
        />
      </div>

      <Field label="Origin" id="origin" error={errors.origin?.message} {...register("origin")} />
      <Field
        label="Product Code"
        id="product_code"
        error={errors.product_code?.message}
        {...register("product_code")}
      />
      <Field
        label="Position（表示順）"
        id="position"
        type="number"
        error={errors.position?.message}
        {...register("position")}
      />

      <label className="flex items-center gap-2 text-[11px] tracking-widest text-graphite uppercase">
        <input type="checkbox" {...register("is_published")} />
        Published
      </label>

      <SizeChartEditor ref={sizeChartRef} initialValue={initialValues?.size_chart ?? null} />

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-ink px-6 py-3 text-xs tracking-widest text-paper uppercase transition-opacity hover:opacity-80 disabled:opacity-50"
      >
        {isSubmitting ? "..." : submitLabel}
      </button>
    </form>
  );
}
