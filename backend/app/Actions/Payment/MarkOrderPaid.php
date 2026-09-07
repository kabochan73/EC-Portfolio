<?php

namespace App\Actions\Payment;

use App\Enums\OrderStatus;
use App\Jobs\SendOrderConfirmationJob;
use App\Models\Order;
use Illuminate\Support\Facades\DB;
use Stripe\Event;
use Stripe\PaymentIntent;

/**
 * Webhook `payment_intent.succeeded` の本体（docs/09-payments-stripe.md）。
 * 冪等: 注文が pending でなければ何もしない。
 */
final class MarkOrderPaid
{
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

            $order->payment?->update([
                'status' => 'succeeded',
                'stripe_charge_id' => $intent->latest_charge,
                'last_error' => null,
            ]);

            $order->update([
                'status' => OrderStatus::Paid,
                'paid_at' => now(),
            ]);

            SendOrderConfirmationJob::dispatch($order->id);
        });
    }
}
