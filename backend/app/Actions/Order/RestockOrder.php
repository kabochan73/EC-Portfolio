<?php

namespace App\Actions\Order;

use App\Models\Order;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;

/**
 * 注文の在庫を戻す（キャンセル時。docs/02 の state machine）。
 * 明細の product_variant_id ごとに stock を quantity 分だけ増やす。
 * variant が削除済み（SET NULL）の明細はスキップ。
 */
final class RestockOrder
{
    public function execute(Order $order): void
    {
        DB::transaction(function () use ($order) {
            $order->loadMissing('items');

            foreach ($order->items as $item) {
                if ($item->product_variant_id === null) {
                    continue;
                }

                ProductVariant::whereKey($item->product_variant_id)
                    ->lockForUpdate()
                    ->first()
                    ?->increment('stock', $item->quantity);
            }
        });
    }
}
