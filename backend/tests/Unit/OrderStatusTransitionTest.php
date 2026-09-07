<?php

use App\Enums\OrderStatus;

dataset('allowed transitions', [
    [OrderStatus::Pending, OrderStatus::Paid],
    [OrderStatus::Pending, OrderStatus::Cancelled],
    [OrderStatus::Paid, OrderStatus::Shipped],
    [OrderStatus::Paid, OrderStatus::Cancelled],
    [OrderStatus::Shipped, OrderStatus::Completed],
    [OrderStatus::Shipped, OrderStatus::Cancelled],
]);

dataset('forbidden transitions', [
    [OrderStatus::Pending, OrderStatus::Shipped],
    [OrderStatus::Pending, OrderStatus::Completed],
    [OrderStatus::Paid, OrderStatus::Completed],
    [OrderStatus::Paid, OrderStatus::Pending],
    [OrderStatus::Shipped, OrderStatus::Paid],
    [OrderStatus::Completed, OrderStatus::Cancelled],
    [OrderStatus::Completed, OrderStatus::Shipped],
    [OrderStatus::Cancelled, OrderStatus::Pending],
    [OrderStatus::Cancelled, OrderStatus::Paid],
]);

it('allows the documented transitions', function (OrderStatus $from, OrderStatus $to) {
    expect($from->canTransitionTo($to))->toBeTrue();
})->with('allowed transitions');

it('rejects every other transition', function (OrderStatus $from, OrderStatus $to) {
    expect($from->canTransitionTo($to))->toBeFalse();
})->with('forbidden transitions');

it('treats completed and cancelled as terminal', function () {
    expect(OrderStatus::Completed->isTerminal())->toBeTrue()
        ->and(OrderStatus::Cancelled->isTerminal())->toBeTrue()
        ->and(OrderStatus::Pending->isTerminal())->toBeFalse();
});

it('never allows a transition to the same status', function () {
    foreach (OrderStatus::cases() as $status) {
        expect($status->canTransitionTo($status))->toBeFalse();
    }
});
