import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import OrderTable from "@/components/admin/OrderTable";
import { fetchAdminCustomer } from "@/lib/admin/customers";
import { fetchAdminOrders } from "@/lib/admin/orders";
import { ApiError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import type { AdminCustomer } from "@/lib/types";

export const metadata: Metadata = { title: "Customer" };

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ja-JP");
}

export default async function AdminCustomerDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { page } = await searchParams;
  const currentPage = page ? Number(page) : 1;
  const customerId = Number(id);

  const { token } = await requireAdmin(`/admin/customers/${id}`);

  let customer: AdminCustomer;
  try {
    customer = await fetchAdminCustomer(token, customerId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const orders = await fetchAdminOrders(token, { customerId, page: currentPage });

  function pageHref(target: number): string {
    return `/admin/customers/${id}?page=${target}`;
  }

  return (
    <div>
      <nav className="mb-6 text-[11px] tracking-widest text-graphite uppercase">
        <Link href="/admin/customers" className="hover:text-ink">
          Customers
        </Link>
        <span className="mx-2">/</span>
        <span>{customer.name}</span>
      </nav>

      <h1 className="text-xl tracking-widest uppercase">{customer.name}</h1>
      <dl className="mt-3 space-y-1 text-sm text-graphite">
        <div className="flex gap-3">
          <dt>Email</dt>
          <dd className="text-ink">{customer.email}</dd>
        </div>
        <div className="flex gap-3">
          <dt>Registered</dt>
          <dd className="text-ink">{formatDate(customer.joined_at)}</dd>
        </div>
        <div className="flex gap-3">
          <dt>Orders</dt>
          <dd className="text-ink">{customer.orders_count}</dd>
        </div>
      </dl>

      <h2 className="mt-10 mb-4 text-[11px] tracking-widest text-graphite uppercase">
        Order History
      </h2>
      <OrderTable
        orders={orders.data}
        showCustomer={false}
        emptyText="この顧客の注文はまだありません。"
      />

      {orders.meta.last_page > 1 && (
        <div className="mt-6 flex items-center gap-4 text-xs tracking-widest uppercase">
          {orders.meta.current_page > 1 ? (
            <Link href={pageHref(orders.meta.current_page - 1)} className="hover:underline">
              Prev
            </Link>
          ) : (
            <span className="text-graphite">Prev</span>
          )}
          <span>
            {orders.meta.current_page} / {orders.meta.last_page}
          </span>
          {orders.meta.current_page < orders.meta.last_page ? (
            <Link href={pageHref(orders.meta.current_page + 1)} className="hover:underline">
              Next
            </Link>
          ) : (
            <span className="text-graphite">Next</span>
          )}
        </div>
      )}
    </div>
  );
}
