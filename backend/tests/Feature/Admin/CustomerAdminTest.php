<?php

use App\Models\Order;
use App\Models\User;

it('lists only customers, with their order counts', function () {
    $c1 = User::factory()->create(['name' => 'Aoi']);
    Order::factory()->for($c1)->count(2)->create();
    User::factory()->create(['name' => 'Ren']);
    User::factory()->admin()->create(['name' => 'Boss']); // excluded

    $this->actingAs(User::factory()->admin()->create())
        ->getJson('/api/admin/customers')
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonStructure(['data' => [['id', 'name', 'email', 'orders_count', 'joined_at']]]);

    $aoi = collect($this->getJson('/api/admin/customers')->json('data'))->firstWhere('name', 'Aoi');
    expect($aoi['orders_count'])->toBe(2);
});

it('searches by name or email', function () {
    User::factory()->create(['name' => 'Tanaka Aoi', 'email' => 'aoi@example.com']);
    User::factory()->create(['name' => 'Suzuki Ren', 'email' => 'ren@example.jp']);

    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->getJson('/api/admin/customers?q=aoi')->assertJsonCount(1, 'data');
    $this->actingAs($admin)->getJson('/api/admin/customers?q=example.jp')->assertJsonCount(1, 'data');
});

it('rejects a non-admin', function () {
    $this->actingAs(User::factory()->create())
        ->getJson('/api/admin/customers')
        ->assertForbidden();
});
