<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CollectionRequest;
use App\Http\Resources\CollectionResource;
use App\Models\Collection;
use App\Services\ActivityLogService;
use Illuminate\Support\Str;

class CollectionController extends Controller
{
    public function __construct(protected ActivityLogService $activityLog) {}

    public function index()
    {
        $collections = Collection::query()->withTrashed()->with('products')->latest()->get();

        return $this->success(CollectionResource::collection($collections), 'OK');
    }

    public function store(CollectionRequest $request)
    {
        $data = $request->validated();
        $data['slug'] = $data['slug'] ?? Str::slug($data['name']);
        $productIds = $data['product_ids'] ?? [];
        unset($data['product_ids']);

        $collection = Collection::create($data);
        $collection->products()->sync(array_values($productIds));

        $this->activityLog->log(request()->user(), 'created', 'collection', $collection->id, null, $data);

        return $this->success(new CollectionResource($collection->load('products')), 'Collection created.', 201);
    }

    public function update(CollectionRequest $request, Collection $collection)
    {
        $data = $request->validated();
        $old = $collection->only(['name', 'is_active']);

        if (array_key_exists('product_ids', $data)) {
            $collection->products()->sync(array_values($data['product_ids']));
            unset($data['product_ids']);
        }

        $collection->update($data);

        $this->activityLog->log(request()->user(), 'updated', 'collection', $collection->id, $old, $data);

        return $this->success(new CollectionResource($collection->fresh('products')), 'Collection updated.');
    }

    public function destroy(Collection $collection)
    {
        $collection->delete();

        $this->activityLog->log(request()->user(), 'deleted', 'collection', $collection->id, $collection->toArray(), null);

        return $this->success(null, 'Collection deleted.');
    }
}
