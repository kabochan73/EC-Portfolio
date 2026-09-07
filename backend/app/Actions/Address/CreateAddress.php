<?php

namespace App\Actions\Address;

use App\Models\Address;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * 住所の新規作成（docs/03-api.md POST /api/addresses）。
 * 最初の1件、または is_default=true 指定なら、その1件だけを default にする。
 */
final class CreateAddress
{
    /**
     * @param  array<string, mixed>  $attributes
     */
    public function execute(User $user, array $attributes): Address
    {
        return DB::transaction(function () use ($user, $attributes) {
            $makeDefault = ($attributes['is_default'] ?? false) || $user->addresses()->doesntExist();

            $address = $user->addresses()->create([
                ...$attributes,
                'is_default' => $makeDefault,
            ]);

            if ($makeDefault) {
                $user->addresses()->whereKeyNot($address->id)->update(['is_default' => false]);
            }

            return $address;
        });
    }
}
