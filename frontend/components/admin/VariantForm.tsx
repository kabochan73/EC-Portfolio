"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import Field from "@/components/ui/Field";
import {
  createVariantSchema,
  type CreateVariantFormValues,
} from "@/lib/schemas/adminVariant";
import type {
  AdminProductVariant,
  CreateVariantPayload,
  UpdateVariantPayload,
} from "@/lib/types";

const SIZES = ["S", "M", "L", "FREE"] as const;

type Props = {
  /** 編集時は既存バリアント、新規作成時は undefined */
  initialValues?: AdminProductVariant;
  onSubmit: (payload: CreateVariantPayload | UpdateVariantPayload) => Promise<void>;
  onCancel: () => void;
};

/**
 * バリアントの追加・編集で共用するフォーム。size は新規作成時のみ選択可
 * （更新では変更不可。docs/05-admin.md）。送信時、編集モードなら size を落とす。
 */
export default function VariantForm({ initialValues, onSubmit, onCancel }: Props) {
  const isEditing = initialValues !== undefined;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateVariantFormValues>({
    resolver: zodResolver(createVariantSchema),
    defaultValues: initialValues
      ? {
          size: initialValues.size as CreateVariantFormValues["size"],
          color: initialValues.color ?? "",
          sku: initialValues.sku ?? "",
          stock: initialValues.stock,
        }
      : { size: "S", color: "", sku: "", stock: 0 },
  });

  async function handleFormSubmit(values: CreateVariantFormValues) {
    const color = values.color ? values.color : null;
    if (isEditing) {
      await onSubmit({ color, sku: values.sku, stock: values.stock });
      return;
    }
    await onSubmit({ ...values, color });
  }

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      noValidate
      className="mt-4 flex flex-wrap items-end gap-4 border border-ink p-4"
    >
      {isEditing ? (
        <div>
          <p className="text-[11px] tracking-widest text-graphite uppercase">Size</p>
          <p className="mt-2 py-2 text-sm">{initialValues.size}</p>
        </div>
      ) : (
        <div>
          <label
            htmlFor="size"
            className="block text-[11px] tracking-widest text-graphite uppercase"
          >
            Size
          </label>
          <select
            id="size"
            className="mt-2 w-24 border-b border-ink bg-transparent py-2 text-sm outline-none"
            {...register("size")}
          >
            {SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="w-32">
        <Field
          label="Color（任意）"
          id="color"
          error={errors.color?.message}
          {...register("color")}
        />
      </div>
      <div className="w-40">
        <Field label="SKU" id="sku" error={errors.sku?.message} {...register("sku")} />
      </div>
      <div className="w-24">
        <Field
          label="Stock"
          id="stock"
          type="number"
          error={errors.stock?.message}
          {...register("stock")}
        />
      </div>

      <div className="flex gap-4 pb-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-ink px-6 py-3 text-xs tracking-widest text-paper uppercase transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          {isSubmitting ? "..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 text-xs tracking-widest text-graphite uppercase hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
