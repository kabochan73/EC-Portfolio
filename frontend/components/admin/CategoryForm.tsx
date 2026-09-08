"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import Field from "@/components/ui/Field";
import {
  adminCategorySchema,
  type AdminCategoryFormValues,
} from "@/lib/schemas/adminCategory";
import type { AdminCategory } from "@/lib/types";

type Props = {
  /** 編集時は既存カテゴリ、新規作成時は undefined */
  initialValues?: AdminCategory;
  onSubmit: (values: AdminCategoryFormValues) => Promise<void>;
  onCancel: () => void;
};

/**
 * カテゴリの追加・編集で共用するフォーム。position は扱わない
 * （新規は末尾に追加、既存は一覧の▲▼で変更 = CategoryManager の責務）。
 */
export default function CategoryForm({ initialValues, onSubmit, onCancel }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminCategoryFormValues>({
    resolver: zodResolver(adminCategorySchema),
    defaultValues: initialValues
      ? { name: initialValues.name, slug: initialValues.slug }
      : undefined,
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="mt-4 space-y-4 border border-ink p-6"
    >
      <Field label="Name" id="name" error={errors.name?.message} {...register("name")} />
      <Field
        label="Slug（例: tops）"
        id="slug"
        placeholder="tops"
        error={errors.slug?.message}
        {...register("slug")}
      />

      <div className="flex gap-4 pt-2">
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
