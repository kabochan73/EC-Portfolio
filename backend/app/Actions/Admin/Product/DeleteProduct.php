<?php

namespace App\Actions\Admin\Product;

use App\Models\Product;
use App\Services\StorageService;

/**
 * 商品削除（docs/05-admin.md）。
 * order_items.product_id は SET NULL（注文履歴のスナップショットは残る）。
 * product_images / product_variants は CASCADE。バケット上の画像実体も掃除する。
 */
final class DeleteProduct
{
    public function __construct(private readonly StorageService $storage) {}

    public function execute(Product $product): void
    {
        $keys = $product->images()->pluck('path')->all();

        $product->delete();

        $this->storage->deleteMany($keys);
    }
}
