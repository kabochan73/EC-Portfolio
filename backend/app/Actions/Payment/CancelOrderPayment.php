<?php

namespace App\Actions\Payment;

use App\Actions\Order\RestockOrder;
use App\Enums\OrderStatus;
use App\Models\Order;
use Illuminate\Support\Facades\DB;
use Stripe\Event;
use Stripe\PaymentIntent;

/**
 * Webhook `payment_intent.canceled`（Stripe 側の自動期限切れ・キャンセル）。
 * 注文が pending のときだけ cancelled にして在庫を戻す（冪等）。
 */
final class CancelOrderPayment
{
    public function __construct(private readonly RestockOrder $restockOrder) {}

    public function execute(Event $event): void
    {
        /** @var PaymentIntent $intent */
        $intent = $event->data->object;
        $orderId = (int) ($intent->metadata->order_id ?? 0);

        DB::transaction(function () use ($intent, $orderId) {
            $order = Order::whereKey($orderId)->lockForUpdate()->first();

            if ($order === null || $order->status !== OrderStatus::Pending) {
                return;
            }

            $order->payment?->update(['status' => $intent->status]);
            $this->restockOrder->execute($order);
            $order->update([
                'status' => OrderStatus::Cancelled,
                'cancelled_at' => now(),
            ]);
        });
    }
}
