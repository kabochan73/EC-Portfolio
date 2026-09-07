<?php

namespace App\Http\Controllers\Api\Order;

use App\Actions\Order\CreateOrder;
use App\Actions\Order\CreateOrderInput;
use App\Http\Controllers\Controller;
use App\Http\Requests\Order\StoreOrderRequest;
use App\Http\Resources\Order\OrderListResource;
use App\Http\Resources\Order\OrderResource;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class OrderController extends Controller
{
    /**
     * POST /api/orders … 注文を pending で作成し在庫を引き当てる（docs/03-api.md）。
     * 要メール認証（verified ミドルウェア）。
     */
    public function store(StoreOrderRequest $request, CreateOrder $createOrder): JsonResponse
    {
        $order = $createOrder->execute(
            user: $request->user(),
            input: CreateOrderInput::fromRequest($request),
        );

        return OrderResource::make($order)->response()->setStatusCode(201);
    }

    /** GET /api/orders … 本人の注文一覧（新しい順・要約）。 */
    public function index(Request $request): AnonymousResourceCollection
    {
        $orders = Order::query()
            ->forUser($request->user())
            ->withSum('items as items_quantity_total', 'quantity')
            ->recentFirst()
            ->get();

        return OrderListResource::collection($orders);
    }

    /** GET /api/orders/{order_number} … 本人の注文詳細。他人の番号は 404。 */
    public function show(Request $request, string $orderNumber): OrderResource
    {
        $order = Order::query()
            ->forUser($request->user())
            ->with(['items.product:id,slug', 'payment'])
            ->where('order_number', $orderNumber)
            ->first();

        if ($order === null) {
            throw new NotFoundHttpException('Order not found.');
        }

        return OrderResource::make($order);
    }
}
