import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import OrderStatusBadge from "@/components/account/OrderStatusBadge";
import OrderStatusActions from "@/components/admin/OrderStatusActions";
import { fetchAdminOrder } from "@/lib/admin/orders";
import { ApiError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import type { AdminOrderDetail } from "@/lib/types";

type PageProps = { params: Promise<{ orderNumber: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { orderNumber } = await params;
  return { title: `Order ${orderNumber}` };
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ja-JP");
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { orderNumber } = await params;
  const { token } = await requireAdmin(`/admin/orders/${orderNumber}`);

  let order: AdminOrderDetail;
  try {
    order = await fetchAdminOrder(token, orderNumber);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const addr = order.shipping_address;
  const timeline: [string, string | null][] = [
    ["Placed", order.placed_at],
    ["Paid", order.paid_at],
    ["Shipped", order.shipped_at],
    ["Cancelled", order.cancelled_at],
  ];

  return (
    <div className="max-w-3xl">
      <nav className="mb-6 text-[11px] tracking-widest text-graphite uppercase">
        <Link href="/admin/orders" className="hover:text-ink">
          Orders
        </Link>
        <span className="mx-2">/</span>
        <span>{order.order_number}</span>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl tracking-widest uppercase">{order.order_number}</h1>
        <OrderStatusBadge status={order.status} />
      </div>

      <section className="mt-8 border border-ink p-6">
        <h2 className="mb-4 text-[11px] tracking-widest text-graphite uppercase">Fulfillment</h2>
        <OrderStatusActions orderNumber={order.order_number} status={order.status} />
      </section>

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <section>
          <h2 className="mb-3 text-[11px] tracking-widest text-graphite uppercase">Customer</h2>
          <p className="text-sm leading-relaxed">
            {order.customer.name ?? "—"}
            <br />
            <span className="text-graphite">{order.customer.email ?? "—"}</span>
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-[11px] tracking-widest text-graphite uppercase">Timeline</h2>
          <dl className="space-y-1 text-sm">
            {timeline.map(([label, iso]) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="text-graphite">{label}</dt>
                <dd>{formatDateTime(iso)}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <h2 className="mb-3 text-[11px] tracking-widest text-graphite uppercase">
            Shipping Address
          </h2>
          <p className="text-sm leading-relaxed">
            {addr.recipient_name}
            <br />〒{addr.postal_code} {addr.prefecture}
            {addr.city}
            <br />
            {addr.address_line1}
            {addr.address_line2 ? ` ${addr.address_line2}` : ""}
            <br />
            {addr.phone}
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-[11px] tracking-widest text-graphite uppercase">Payment</h2>
          {order.payment ? (
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-graphite">Status</dt>
                <dd className="tracking-widest uppercase">{order.payment.status}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-graphite">Intent</dt>
                <dd className="truncate">{order.payment.stripe_payment_intent_id ?? "—"}</dd>
              </div>
              {order.payment.refunded_at && (
                <div className="flex justify-between gap-4">
                  <dt className="text-graphite">Refunded</dt>
                  <dd>{formatDateTime(order.payment.refunded_at)}</dd>
                </div>
              )}
              {order.payment.last_error && (
                <p className="mt-2 text-xs text-graphite">{order.payment.last_error}</p>
              )}
            </dl>
          ) : (
            <p className="text-sm text-graphite">未決済</p>
          )}
        </section>
      </div>

      <section className="mt-10 border-t border-ink">
        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex justify-between border-b border-mist py-4 text-sm"
          >
            <div>
              <p>{item.product_name}</p>
              <p className="mt-1 text-[11px] tracking-widest text-graphite uppercase">
                {item.size}
                {item.color ? ` / ${item.color}` : ""} × {item.quantity}
              </p>
            </div>
            <p>¥{item.line_total.toLocaleString("ja-JP")}</p>
          </div>
        ))}
      </section>

      <dl className="mt-6 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="tracking-widest text-graphite uppercase">Subtotal</dt>
          <dd>¥{order.subtotal.toLocaleString("ja-JP")}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="tracking-widest text-graphite uppercase">Shipping</dt>
          <dd>
            {order.shipping_fee === 0
              ? "FREE"
              : `¥${order.shipping_fee.toLocaleString("ja-JP")}`}
          </dd>
        </div>
        <div className="flex justify-between border-t border-ink pt-2 text-base">
          <dt className="tracking-widest uppercase">Total</dt>
          <dd>¥{order.total.toLocaleString("ja-JP")}</dd>
        </div>
      </dl>
    </div>
  );
}
