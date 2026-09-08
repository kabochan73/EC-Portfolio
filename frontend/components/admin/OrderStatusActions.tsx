"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { OrderStatus } from "@/lib/types";

// backend/app/Enums/OrderStatus.php の transitions() と揃える。
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["paid", "cancelled"],
  paid: ["shipped", "cancelled"],
  shipped: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

// admin が実行できるのは shipped / completed / cancelled のみ（paid は Webhook）。
const ADMIN_ALLOWED: OrderStatus[] = ["shipped", "completed", "cancelled"];

const ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  shipped: "Mark as Shipped",
  completed: "Mark as Completed",
  cancelled: "Cancel Order",
};

export default function OrderStatusActions({
  orderNumber,
  status,
}: {
  orderNumber: string;
  status: OrderStatus;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState<OrderStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const targets = TRANSITIONS[status].filter((s) => ADMIN_ALLOWED.includes(s));

  if (targets.length === 0) {
    return (
      <p className="text-[11px] tracking-widest text-graphite uppercase">
        この注文はこれ以上変更できません。
      </p>
    );
  }

  async function run(target: OrderStatus) {
    if (target === "cancelled") {
      const note =
        status === "paid"
          ? "この注文をキャンセルします（Stripe 返金 + 在庫を戻します）。よろしいですか？"
          : status === "shipped"
            ? "発送済み注文をキャンセルします（返品扱い・在庫は戻しません）。よろしいですか？"
            : "この注文をキャンセルし、在庫を戻します。よろしいですか？";
      if (!window.confirm(note)) return;
    }

    setSubmitting(target);
    setError(null);

    const res = await fetch(`/bff/admin/orders/${orderNumber}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: target }),
    });
    setSubmitting(null);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.message ?? "ステータス変更に失敗しました。");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      {error && <p className="mb-3 text-xs text-graphite">{error}</p>}
      <div className="flex flex-wrap gap-3">
        {targets.map((target) => (
          <button
            key={target}
            type="button"
            onClick={() => run(target)}
            disabled={submitting !== null}
            className={`px-6 py-3 text-xs tracking-widest uppercase transition-colors disabled:opacity-50 ${
              target === "cancelled"
                ? "border border-ink hover:bg-mist"
                : "bg-ink text-paper hover:opacity-80"
            }`}
          >
            {submitting === target ? "..." : (ACTION_LABEL[target] ?? target)}
          </button>
        ))}
      </div>
    </div>
  );
}
