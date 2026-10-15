<?php

use App\Http\Controllers\Api\Account\AddressController;
use App\Http\Controllers\Api\Account\ProfileController;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Auth\PasswordResetController;
use App\Http\Controllers\Api\Order\CheckoutController;
use App\Http\Controllers\Api\Order\OrderController;
use App\Http\Controllers\Api\Shop\CartController;
use App\Http\Controllers\Api\Shop\CategoryController;
use App\Http\Controllers\Api\Shop\ProductController;
use App\Http\Controllers\Api\Shop\SiteContentController;
use App\Http\Controllers\Api\Webhook\StripeController;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

// ヘルスチェック。API が起きているか＆DB に繋がっているかを1発で確認する用。
// BFF（Next.js）の /bff/health からも叩く（docs/03-api.md）。
Route::get('/health', function () {
    try {
        DB::connection()->getPdo();
        $db = 'ok';
    } catch (Throwable) {
        $db = 'error';
    }

    return response()->json([
        'status' => 'ok',
        'app' => config('app.name'),
        'database' => $db,
        'time' => now()->toIso8601String(),
    ]);
});

// --- 商品閲覧（公開） ---
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{slug}', [ProductController::class, 'show']);

// カート明細の再検証（/cart・/checkout 表示時。docs/03-api.md）
Route::get('/cart/validate', [CartController::class, 'validate']);

// トップページの CMS コンテンツ（docs/11-cms.md）
Route::get('/content', [SiteContentController::class, 'index']);

// --- 認証（公開） ---
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:register');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');

// パスワードリセット
Route::post('/forgot-password', [PasswordResetController::class, 'sendLink'])->middleware('throttle:password-reset');
Route::post('/reset-password', [PasswordResetController::class, 'reset'])->middleware('throttle:password-reset');

// Stripe Webhook … 認証なし・署名検証のみ（docs/09）。ブラウザ（BFF）を経由しない唯一のエンドポイント
Route::post('/stripe/webhook', StripeController::class)
    ->middleware('throttle:60,1')
    ->name('stripe.webhook');

// --- 認証必須 ---
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/me', [ProfileController::class, 'show']);
    Route::put('/me', [ProfileController::class, 'update']);
    Route::put('/me/password', [ProfileController::class, 'updatePassword']);

    // --- 住所録（本人のもののみ。他人の ID は 404） ---
    Route::get('/addresses', [AddressController::class, 'index']);
    Route::post('/addresses', [AddressController::class, 'store']);
    Route::put('/addresses/{address}', [AddressController::class, 'update']);
    Route::delete('/addresses/{address}', [AddressController::class, 'destroy']);
    Route::post('/addresses/{address}/default', [AddressController::class, 'setDefault']);

    // --- 注文 ---
    // メール認証は実装していない（2026-09-14・ポートフォリオ用途のため撤去）。
    Route::post('/orders', [OrderController::class, 'store'])->middleware('throttle:orders');
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{orderNumber}', [OrderController::class, 'show']);

    // --- 決済 ---
    Route::post('/checkout/payment-intent', [CheckoutController::class, 'paymentIntent']);
});

// --- 管理画面（admin ロールのみ。定義は routes/admin.php。docs/05-admin.md） ---
Route::middleware(['auth:sanctum', 'admin'])
    ->prefix('admin')
    ->group(base_path('routes/admin.php'));
