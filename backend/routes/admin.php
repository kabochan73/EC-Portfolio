<?php

use App\Http\Controllers\Api\Admin\CategoryController;
use App\Http\Controllers\Api\Admin\CustomerController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\OrderController;
use App\Http\Controllers\Api\Admin\ProductController;
use App\Http\Controllers\Api\Admin\ProductImageController;
use App\Http\Controllers\Api\Admin\SiteContentController;
use App\Http\Controllers\Api\Admin\VariantController;
use App\Models\SiteContent;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| 管理 API（/api/admin/*）… admin ロールのみ。docs/05-admin.md
|--------------------------------------------------------------------------
| routes/api.php から prefix('admin') + middleware(['auth:sanctum', 'admin'])
| のグループとして読み込まれる。ここには「グループ内の定義」だけを書く。
*/

// --- カテゴリ（reorder は {category} より先に登録し、静的パスを先にマッチさせる） ---
Route::put('/categories/reorder', [CategoryController::class, 'reorder']);
Route::get('/categories', [CategoryController::class, 'index']);
Route::post('/categories', [CategoryController::class, 'store']);
Route::put('/categories/{category}', [CategoryController::class, 'update']);
Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);

// --- 商品（基本情報） ---
Route::get('/products', [ProductController::class, 'index']);
Route::post('/products', [ProductController::class, 'store']);
Route::get('/products/{product}', [ProductController::class, 'show']);
Route::put('/products/{product}', [ProductController::class, 'update']);
Route::delete('/products/{product}', [ProductController::class, 'destroy']);

// --- 商品画像（reorder は静的パスなので {productImage} と衝突しない） ---
Route::post('/products/{product}/images', [ProductImageController::class, 'store']);
Route::put('/products/{product}/images/reorder', [ProductImageController::class, 'reorder']);
Route::delete('/product-images/{productImage}', [ProductImageController::class, 'destroy']);

// --- バリアント（サイズ×色） ---
Route::post('/products/{product}/variants', [VariantController::class, 'store']);
Route::put('/variants/{variant}', [VariantController::class, 'update']);
Route::delete('/variants/{variant}', [VariantController::class, 'destroy']);

// --- 注文（全ユーザー横断） ---
Route::get('/orders', [OrderController::class, 'index']);
Route::get('/orders/{orderNumber}', [OrderController::class, 'show']);
Route::put('/orders/{orderNumber}/status', [OrderController::class, 'updateStatus']);

// --- 会員（閲覧のみ） ---
Route::get('/customers', [CustomerController::class, 'index']);
Route::get('/customers/{customer}', [CustomerController::class, 'show']);

// --- ダッシュボード ---
Route::get('/stats', [DashboardController::class, 'stats']);

// --- CMS（トップページのコンテンツ。docs/11-cms.md） ---
Route::get('/content', [SiteContentController::class, 'index']);
Route::put('/content/{key}', [SiteContentController::class, 'update'])->whereIn('key', SiteContent::KEYS);
Route::post('/content/{key}/images', [SiteContentController::class, 'uploadImage'])->whereIn('key', SiteContent::KEYS);
