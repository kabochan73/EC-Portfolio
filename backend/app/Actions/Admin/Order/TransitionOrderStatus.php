<?php

namespace App\Actions\Admin\Order;

use App\Actions\Order\RestockOrder;
use App\Enums\OrderStatus;
use App\Exceptions\InvalidOrderTransitionException;
use App\Jobs\SendOrderShippedJob;
use App\Models\Order;
use App\Services\StripeService;
use Illuminate\Support\Facades\DB;

/**
 * 注文ステータス遷移の唯一の入口（docs/02-database-design.md の state machine）。
 * 「遷移が許されるか」は OrderStatus::canTransitionTo。副作用はここ。
 *
 *  - *→cancelled（from pending/paid）: 在庫を戻す
 *  - paid→cancelled: さらに Stripe 返金
 *  - shipped→cancelled: 返品扱い。在庫は戻さない（手動対応前提）
 *  - paid→shipped: shipped_at + 発送通知メール
 *  - shipped→completed: 副作用なし
 */
final class TransitionOrderStatus
{
    public function __construct(
        private readonly RestockOrder $restockOrder,
        private readonly StripeService $stripe,
    ) {}

    public function execute(Order $order, OrderStatus $to): Order
    {
        return DB::transaction(function () use ($order, $to) {
            $order = Order::whereKey($order->id)->lockForUpdate()->firstOrFail();
            $from = $order->status;

            if (! $from->canTransitionTo($to)) {
                throw new InvalidOrderTransitionException($from, $to);
            }

            match ($to) {
                OrderStatus::Cancelled => $this->cancel($order, $from),
                OrderStatus::Shipped => $this->ship($order),
                default => null,
            };

            $order->update([
                'status' => $to,
                ...$this->timestampFor($to),
            ]);

            return $order->fresh();
        });
    }

    private function cancel(Order $order, OrderStatus $from): void
    {
        if ($from === OrderStatus::Paid) {
            $order->loadMissing('payment');
            if ($order->payment !== null && $order->payment->refunded_at === null) {
                $this->stripe->refund($order->payment->stripe_payment_intent_id);
                $order->payment->update(['refunded_at' => now()]);
            }
        }

        // 発送済みからのキャンセル（返品）は在庫を戻さない
        if (in_array($from, [OrderStatus::Pending, OrderStatus::Paid], true)) {
            $this->restockOrder->execute($order);
        }
    }

    private function ship(Order $order): void
    {
        SendOrderShippedJob::dispatch($order->id);
    }

    /**
     * @return array<string, mixed>
     */
    private function timestampFor(OrderStatus $to): array
    {
        return match ($to) {
            OrderStatus::Shipped => ['shipped_at' => now()],
            OrderStatus::Cancelled => ['cancelled_at' => now()],
            default => [],
        };
    }
}
