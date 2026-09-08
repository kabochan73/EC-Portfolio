import type { Metadata } from "next";
import Link from "next/link";

import OrderStatusBadge from "@/components/account/OrderStatusBadge";
import { fetchAdminOrders } from "@/lib/admin/orders";
import { requireAdmin } from "@/lib/auth";
import type { OrderStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Admin Orders" };

const STATUSES: OrderStatus[] = ["pending", "paid", "shipped", "completed", "cancelled"];

type PageProps = { searchParams: Promise<{ status?: string; page?: string }> };

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ja-JP");
}

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

      {result.data.length === 0 ? (
        <p className="text-sm text-graphite">No orders found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink text-left text-[11px] tracking-widest text-graphite uppercase">
                <th className="py-2 pr-4 font-normal">Order</th>
                <th className="py-2 pr-4 font-normal">Customer</th>
                <th className="py-2 pr-4 font-normal">Date</th>
                <th className="py-2 pr-4 font-normal">Items</th>
                <th className="py-2 pr-4 font-normal">Status</th>
                <th className="py-2 text-right font-normal">Total</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((order) => (
                <tr key={order.order_number} className="border-b border-mist">
                  <td className="py-3 pr-4">
                    <Link
                      href={`/admin/orders/${order.order_number}`}
                      className="tracking-wide hover:underline"
                    >
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="py-3 pr-4">{order.customer.name ?? "—"}</td>
                  <td className="py-3 pr-4 text-graphite">{formatDate(order.placed_at)}</td>
                  <td className="py-3 pr-4 text-graphite">{order.item_count}</td>
                  <td className="py-3 pr-4">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="py-3 text-right">
                    ¥{order.total.toLocaleString("ja-JP")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
