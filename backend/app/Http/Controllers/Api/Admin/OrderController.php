<?php

namespace App\Http\Controllers\Api\Admin;

use App\Actions\Admin\Order\TransitionOrderStatus;
use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Order\UpdateOrderStatusRequest;
use App\Http\Resources\Admin\OrderListResource;
use App\Http\Resources\Admin\OrderResource;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class OrderController extends Controller
{
    /** GET /api/admin/orders … 全ユーザーの注文。?status= &page= */
    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'status' => ['sometimes', Rule::enum(OrderStatus::class)],
            'page' => ['sometimes', 'integer', 'min:1'],
        ]);

        $orders = Order::query()
            ->with('user:id,name,email')
            ->withSum('items as items_quantity_total', 'quantity')
            ->when(isset($filters['status']), fn ($q) => $q->where('status', $filters['status']))
            ->recentFirst()
            ->paginate(20);

        return OrderListResource::collection($orders);
    }

    /** GET /api/admin/orders/{order_number} … 明細・配送先・顧客・決済情報。 */
    public function show(string $orderNumber): OrderResource
    {
        $order = Order::query()
            ->with(['user:id,name,email', 'items.product:id,slug', 'payment'])
            ->where('order_number', $orderNumber)
            ->first();

        if ($order === null) {
            throw new NotFoundHttpException('Order not found.');
        }

        return OrderResource::make($order);
    }

    /** PUT /api/admin/orders/{order_number}/status … state machine（docs/02）。不正遷移は 422。 */
    public function updateStatus(UpdateOrderStatusRequest $request, string $orderNumber, TransitionOrderStatus $transitionOrderStatus): OrderResource
    {
        $order = Order::where('order_number', $orderNumber)->first();

        if ($order === null) {
            throw new NotFoundHttpException('Order not found.');
        }

        $updated = $transitionOrderStatus->execute($order, OrderStatus::from($request->string('status')->toString()));

        return OrderResource::make($updated->load(['user:id,name,email', 'items.product:id,slug', 'payment']));
    }
}
