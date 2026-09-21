<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Services\ActivityLogService;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function __construct(protected ActivityLogService $activityLog) {}

    public function index()
    {
        $categories = Category::query()->withTrashed()->with('children')->orderBy('sort_order')->get();

        return $this->success(CategoryResource::collection($categories), 'OK');
    }

    public function store(CategoryRequest $request)
    {
        $data = $request->validated();
        $data['slug'] = $data['slug'] ?? Str::slug($data['name']);

        $category = Category::create($data);

        $this->activityLog->log(request()->user(), 'created', 'category', $category->id, null, $data);

        return $this->success(new CategoryResource($category), 'Category created.', 201);
    }

    public function update(CategoryRequest $request, Category $category)
    {
        $data = $request->validated();
        $old = $category->only(['name', 'parent_id', 'is_active']);

        $category->update($data);

        $this->activityLog->log(request()->user(), 'updated', 'category', $category->id, $old, $data);

        return $this->success(new CategoryResource($category), 'Category updated.');
    }

    public function destroy(Category $category)
    {
        $category->delete();

        $this->activityLog->log(request()->user(), 'deleted', 'category', $category->id, $category->toArray(), null);

        return $this->success(null, 'Category deleted.');
    }
}
