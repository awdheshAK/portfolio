<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\FabricResource;
use App\Models\Fabric;

class FabricController extends Controller
{
    public function index()
    {
        $fabrics = Fabric::query()->where('is_active', true)->orderBy('name')->get();

        return $this->success(FabricResource::collection($fabrics), 'OK');
    }

    public function show(string $slug)
    {
        $fabric = Fabric::query()->where('slug', $slug)->where('is_active', true)->firstOrFail();

        return $this->success(new FabricResource($fabric), 'OK');
    }
}
