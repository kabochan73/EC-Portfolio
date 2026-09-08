import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import EditProductClient from "@/components/admin/EditProductClient";
import { fetchAdminCategories } from "@/lib/admin/categories";
import { fetchAdminProduct } from "@/lib/admin/products";
import { ApiError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import type { AdminProduct } from "@/lib/types";

type PageProps = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "Edit Product" };

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;
  const { token } = await requireAdmin(`/admin/products/${id}`);

  let product: AdminProduct;
  try {
    product = await fetchAdminProduct(token, Number(id));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const categories = await fetchAdminCategories(token);

  return (
    <div>
      <nav className="mb-6 text-[11px] tracking-widest text-graphite uppercase">
        <Link href="/admin/products" className="hover:text-ink">
          Products
        </Link>
        <span className="mx-2">/</span>
        <span>{product.name}</span>
      </nav>
      <h1 className="mb-8 text-xl tracking-widest uppercase">Edit Product</h1>
      <EditProductClient product={product} categories={categories} />
    </div>
  );
}
