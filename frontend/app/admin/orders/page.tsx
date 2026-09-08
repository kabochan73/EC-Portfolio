import type { Metadata } from "next";
import Link from "next/link";

import OrderTable from "@/components/admin/OrderTable";
import { fetchAdminOrders } from "@/lib/admin/orders";
import { requireAdmin } from "@/lib/auth";
import type { OrderStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Admin Orders" };

const STATUSES: OrderStatus[] = ["pending", "paid", "shipped", "completed", "cancelled"];

type PageProps = { searchParams: Promise<{ status?: string; page?: string }> };

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const { token } = await requireAdmin("/admin/orders");
  const { status, page } = await searchParams;
  const currentPage = page ? Number(page) : 1;

  const result = await fetchAdminOrders(token, { status, page: currentPage });

  function pageHref(target: number): string {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    params.set("page", String(target));
    return `/admin/orders?${params.toString()}`;
  }

  return (
    <div>
      <h1 className="mb-8 text-xl tracking-widest uppercase">Orders</h1>

      <form method="get" className="mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label
            htmlFor="status"
            className="block text-[11px] tracking-widest text-graphite uppercase"
          >
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status ?? ""}
            className="mt-2 w-40 border-b border-ink bg-transparent py-2 text-sm outline-none"
          >
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="border border-ink px-6 py-2 text-xs tracking-widest uppercase transition-colors hover:bg-mist"
        >
          Filter
        </button>
      </form>

      <OrderTable orders={result.data} />

      {result.meta.last_page > 1 && (
        <div className="mt-6 flex items-center gap-4 text-xs tracking-widest uppercase">
          {result.meta.current_page > 1 ? (
            <Link href={pageHref(result.meta.current_page - 1)} className="hover:underline">
              Prev
            </Link>
          ) : (
            <span className="text-graphite">Prev</span>
          )}
          <span>
            {result.meta.current_page} / {result.meta.last_page}
          </span>
          {result.meta.current_page < result.meta.last_page ? (
            <Link href={pageHref(result.meta.current_page + 1)} className="hover:underline">
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
