<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SizeRequest;
use App\Http\Resources\SizeResource;
use App\Models\Size;
use App\Services\ActivityLogService;
use Illuminate\Support\Str;

class SizeController extends Controller
{
    public function __construct(protected ActivityLogService $activityLog) {}

    public function index()
    {
        return $this->success(SizeResource::collection(Size::query()->orderBy('sort_order')->get()), 'OK');
    }

    public function store(SizeRequest $request)
    {
        $data = $request->validated();
        $data['slug'] = $data['slug'] ?? Str::slug($data['label']);

        $size = Size::create($data);

        $this->activityLog->log(request()->user(), 'created', 'size', $size->id, null, $data);

        return $this->success(new SizeResource($size), 'Size created.', 201);
    }

    public function update(SizeRequest $request, Size $size)
    {
        $data = $request->validated();
        $old = $size->toArray();

        $size->update($data);

        $this->activityLog->log(request()->user(), 'updated', 'size', $size->id, $old, $data);

        return $this->success(new SizeResource($size), 'Size updated.');
    }

    public function destroy(Size $size)
    {
        $size->delete();

        $this->activityLog->log(request()->user(), 'deleted', 'size', $size->id, $size->toArray(), null);

        return $this->success(null, 'Size deleted.');
    }
}
