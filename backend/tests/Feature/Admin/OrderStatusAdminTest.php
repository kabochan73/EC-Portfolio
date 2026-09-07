<?php

use App\Enums\OrderStatus;
use App\Jobs\SendOrderShippedJob;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use App\Services\StripeService;
use Illuminate\Support\Facades\Queue;
use Illuminate\Testing\TestResponse;
use Stripe\Refund;

function statusAdmin(): User
{
    return User::factory()->admin()->create();
}

function orderWithStock(OrderStatus $status, int $stock = 8, int $qty = 2): array
{
    $product = Product::factory()->create();
    $variant = ProductVariant::factory()->for($product)->create(['size' => 'M', 'stock' => $stock]);
    $order = Order::factory()->create(['status' => $status]);
    $order->items()->create([
        'product_id' => $product->id,
        'product_variant_id' => $variant->id,
        'product_name' => $product->name,
        'variant_size' => 'M',
        'unit_price' => 6_000,
        'quantity' => $qty,
        'line_total' => 6_000 * $qty,
    ]);

    return [$order, $variant];
}

function putStatus(Order $order, string $status): TestResponse
{
    return test()->actingAs(statusAdmin())
        ->putJson("/api/admin/orders/{$order->order_number}/status", ['status' => $status]);
}

it('marks a paid order as shipped and queues the shipped mail', function () {
    Queue::fake();
    [$order] = orderWithStock(OrderStatus::Paid);

    putStatus($order, 'shipped')
        ->assertOk()
        ->assertJsonPath('data.status', 'shipped');

    expect($order->fresh()->shipped_at)->not->toBeNull();
    Queue::assertPushed(SendOrderShippedJob::class);
});

it('completes a shipped order', function () {
    [$order] = orderWithStock(OrderStatus::Shipped);

    putStatus($order, 'completed')
        ->assertOk()
        ->assertJsonPath('data.status', 'completed');
});

it('cancels a pending order and restocks', function () {
    [$order, $variant] = orderWithStock(OrderStatus::Pending, stock: 8, qty: 2);

    putStatus($order, 'cancelled')->assertOk();

    expect($order->fresh()->status)->toBe(OrderStatus::Cancelled)
        ->and($order->fresh()->cancelled_at)->not->toBeNull()
        ->and($variant->fresh()->stock)->toBe(10);
});

it('cancels a paid order: refunds via Stripe and restocks', function () {
    [$order, $variant] = orderWithStock(OrderStatus::Paid, stock: 8, qty: 2);
    Payment::factory()->for($order)->succeeded()->create(['stripe_payment_intent_id' => 'pi_ref_1']);

    $this->mock(StripeService::class)
        ->shouldReceive('refund')->once()->with('pi_ref_1')
        ->andReturn(Refund::constructFrom(['id' => 're_1']));

    putStatus($order, 'cancelled')->assertOk();

    expect($order->fresh()->status)->toBe(OrderStatus::Cancelled)
        ->and($order->fresh()->payment->refunded_at)->not->toBeNull()
        ->and($variant->fresh()->stock)->toBe(10);
});

it('cancels a shipped order without restocking (return handled manually)', function () {
    [$order, $variant] = orderWithStock(OrderStatus::Shipped, stock: 8, qty: 2);
    Payment::factory()->for($order)->succeeded()->create(['stripe_payment_intent_id' => 'pi_ship_ref']);

    $this->mock(StripeService::class)->shouldReceive('refund')->never();

    putStatus($order, 'cancelled')->assertOk();

    expect($order->fresh()->status)->toBe(OrderStatus::Cancelled)
        ->and($variant->fresh()->stock)->toBe(8); // 戻さない
});

it('rejects an invalid transition (422)', function () {
    [$order] = orderWithStock(OrderStatus::Pending);

    putStatus($order, 'shipped')
        ->assertStatus(422)
        ->assertJsonValidationErrorFor('status');

    [$completed] = orderWithStock(OrderStatus::Completed);
    putStatus($completed, 'cancelled')->assertStatus(422);
});

it('rejects setting status to pending or paid via the admin endpoint', function () {
    [$order] = orderWithStock(OrderStatus::Paid);

    putStatus($order, 'paid')->assertStatus(422);
    putStatus($order, 'pending')->assertStatus(422);
});

it('returns 404 for an unknown order number', function () {
    $this->actingAs(statusAdmin())
        ->putJson('/api/admin/orders/EC-20000101-0001/status', ['status' => 'shipped'])
        ->assertNotFound();
});

it('rejects a non-admin', function () {
    [$order] = orderWithStock(OrderStatus::Paid);

    $this->actingAs(User::factory()->create())
        ->putJson("/api/admin/orders/{$order->order_number}/status", ['status' => 'shipped'])
        ->assertForbidden();
});
