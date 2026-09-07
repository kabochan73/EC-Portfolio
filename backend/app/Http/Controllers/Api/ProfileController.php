<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    /** GET /api/me … ログインユーザー（docs/03-api.md）。 */
    public function show(Request $request): UserResource
    {
        return UserResource::make($request->user());
    }
}
