<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CategoryController extends Controller
{
    /** 公開カテゴリ一覧（position 順）。docs/03-api.md */
    public function index(): AnonymousResourceCollection
    {
        return CategoryResource::collection(Category::ordered()->get());
    }
}
