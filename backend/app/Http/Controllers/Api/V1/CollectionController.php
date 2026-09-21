<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\CollectionResource;
use App\Models\Collection;

class CollectionController extends Controller
{
    public function index()
    {
        $collections = Collection::query()->where('is_active', true)->orderBy('name')->get();

        return $this->success(CollectionResource::collection($collections), 'OK');
    }

    public function show(string $slug)
    {
        $collection = Collection::query()
            ->where('slug', $slug)
            ->where('is_active', true)
            ->with(['products' => fn ($q) => $q->where('is_active', true)->with(['category', 'images'])])
            ->firstOrFail();

        return $this->success(new CollectionResource($collection), 'OK');
    }
}
