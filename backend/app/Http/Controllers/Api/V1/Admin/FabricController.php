<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\FabricRequest;
use App\Http\Resources\FabricResource;
use App\Models\Fabric;
use App\Services\ActivityLogService;
use Illuminate\Support\Str;

class FabricController extends Controller
{
    public function __construct(protected ActivityLogService $activityLog) {}

    public function index()
    {
        $fabrics = Fabric::query()->withTrashed()->orderBy('name')->get();

        return $this->success(FabricResource::collection($fabrics), 'OK');
    }

    public function store(FabricRequest $request)
    {
        $data = $request->validated();
        $data['slug'] = $data['slug'] ?? Str::slug($data['name']);

        $fabric = Fabric::create($data);

        $this->activityLog->log(request()->user(), 'created', 'fabric', $fabric->id, null, $data);

        return $this->success(new FabricResource($fabric), 'Fabric created.', 201);
    }

    public function update(FabricRequest $request, Fabric $fabric)
    {
        $data = $request->validated();
        $old = $fabric->toArray();

        $fabric->update($data);

        $this->activityLog->log(request()->user(), 'updated', 'fabric', $fabric->id, $old, $data);

        return $this->success(new FabricResource($fabric), 'Fabric updated.');
    }

    public function destroy(Fabric $fabric)
    {
        $fabric->delete();

        $this->activityLog->log(request()->user(), 'deleted', 'fabric', $fabric->id, $fabric->toArray(), null);

        return $this->success(null, 'Fabric deleted.');
    }
}
