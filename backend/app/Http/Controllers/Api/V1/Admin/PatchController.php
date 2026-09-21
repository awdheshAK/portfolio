<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\PatchRequest;
use App\Http\Resources\PatchResource;
use App\Models\Patch;
use App\Services\ActivityLogService;
use Illuminate\Support\Str;

class PatchController extends Controller
{
    public function __construct(protected ActivityLogService $activityLog) {}

    public function index()
    {
        return $this->success(PatchResource::collection(Patch::query()->orderBy('name')->get()), 'OK');
    }

    public function store(PatchRequest $request)
    {
        $data = $request->validated();
        $data['slug'] = $data['slug'] ?? Str::slug($data['name']);

        $patch = Patch::create($data);

        $this->activityLog->log(request()->user(), 'created', 'patch', $patch->id, null, $data);

        return $this->success(new PatchResource($patch), 'Patch created.', 201);
    }

    public function update(PatchRequest $request, Patch $patch)
    {
        $data = $request->validated();
        $old = $patch->toArray();

        $patch->update($data);

        $this->activityLog->log(request()->user(), 'updated', 'patch', $patch->id, $old, $data);

        return $this->success(new PatchResource($patch), 'Patch updated.');
    }

    public function destroy(Patch $patch)
    {
        $patch->delete();

        $this->activityLog->log(request()->user(), 'deleted', 'patch', $patch->id, $patch->toArray(), null);

        return $this->success(null, 'Patch deleted.');
    }
}
