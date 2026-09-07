<?php

use App\Domain\Order\OrderNumberGenerator;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;

// 採番は DB の当日件数を見るので RefreshDatabase を使う（docs/12-testing.md）
uses(RefreshDatabase::class);

it('formats the number as EC-YYYYMMDD-0001 for the first order of the day', function () {
    Carbon::setTestNow('2026-09-08 10:00:00');

    expect((new OrderNumberGenerator)->generate())->toBe('EC-20260908-0001');
});

it('increments the daily sequence', function () {
    Carbon::setTestNow('2026-09-08 10:00:00');
    $user = User::factory()->create();
    Order::factory()->for($user)->create(['order_number' => 'EC-20260908-0001']);
    Order::factory()->for($user)->create(['order_number' => 'EC-20260908-0002']);

    expect((new OrderNumberGenerator)->generate())->toBe('EC-20260908-0003');
});

it('starts a fresh sequence on a new day', function () {
    $user = User::factory()->create();
    Carbon::setTestNow('2026-09-08 23:59:00');
    Order::factory()->for($user)->create(['order_number' => 'EC-20260908-0007']);

    Carbon::setTestNow('2026-09-09 00:01:00');

    expect((new OrderNumberGenerator)->generate())->toBe('EC-20260909-0001');
});

it('skips a sequence number that is already taken out of order', function () {
    Carbon::setTestNow('2026-09-08 10:00:00');
    $user = User::factory()->create();
    // 連番が飛んでいる（0001 が無く 0002 だけ）状況でも衝突しない番号を返す
    Order::factory()->for($user)->create(['order_number' => 'EC-20260908-0002']);

    expect((new OrderNumberGenerator)->generate())->toBe('EC-20260908-0003');
});

afterEach(fn () => Carbon::setTestNow());
