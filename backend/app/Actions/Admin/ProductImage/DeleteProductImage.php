<?php

namespace App\Actions\Admin\ProductImage;

use App\Models\ProductImage;
use App\Services\StorageService;

final class DeleteProductImage
{
    public function __construct(private readonly StorageService $storage) {}

    public function execute(ProductImage $image): void
    {
        $this->storage->delete($image->path);
        $image->delete();
    }
}
