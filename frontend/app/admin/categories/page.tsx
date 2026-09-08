import type { Metadata } from "next";

import CategoryManager from "@/components/admin/CategoryManager";
import { fetchAdminCategories } from "@/lib/admin/categories";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin Categories" };

export default async function AdminCategoriesPage() {
  const { token } = await requireAdmin("/admin/categories");
  const categories = await fetchAdminCategories(token);

  return (
    <div>
      <h1 className="mb-8 text-xl tracking-widest uppercase">Categories</h1>
      <CategoryManager initial={categories} />
    </div>
  );
}
