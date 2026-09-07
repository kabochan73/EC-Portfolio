<?php

namespace App\Domain\Order;

use App\Models\Order;
use RuntimeException;

/**
 * 注文番号の採番（docs/02-database-design.md）。形式 EC-YYYYMMDD-NNNN（当日連番）。
 *
 * 当日の既存件数 + 1 を連番にする。並行作成での衝突は orders.order_number の
 * UNIQUE 制約が最終防衛線。ここでは数回リトライして次の番号を試す。
 */
final class OrderNumberGenerator
{
    private const MAX_ATTEMPTS = 20;

    public function generate(): string
    {
        $prefix = (string) config('shop.order_number_prefix');
        $date = now()->format('Ymd');

        $taken = Order::query()
            ->where('order_number', 'like', "{$prefix}-{$date}-%")
            ->pluck('order_number')
            ->map(fn (string $number) => (int) substr($number, -4))
            ->all();

        $sequence = ($taken === [] ? 0 : max($taken));

        for ($i = 0; $i < self::MAX_ATTEMPTS; $i++) {
            $sequence++;
            $candidate = sprintf('%s-%s-%04d', $prefix, $date, $sequence);

            if (! in_array($sequence, $taken, true)
                && ! Order::where('order_number', $candidate)->exists()) {
                return $candidate;
            }
        }

        throw new RuntimeException('注文番号の採番に失敗しました。');
    }
}
