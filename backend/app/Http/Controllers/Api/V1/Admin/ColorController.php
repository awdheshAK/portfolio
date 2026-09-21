<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ColorRequest;
use App\Http\Resources\ColorResource;
use App\Models\Color;
use App\Services\ActivityLogService;
use Illuminate\Support\Str;

class ColorController extends Controller
{
    public function __construct(protected ActivityLogService $activityLog) {}

    public function index()
    {
        return $this->success(ColorResource::collection(Color::query()->orderBy('name')->get()), 'OK');
    }

    public function store(ColorRequest $request)
    {
        $data = $request->validated();
        $data['slug'] = $data['slug'] ?? Str::slug($data['name']);

        $color = Color::create($data);

        $this->activityLog->log(request()->user(), 'created', 'color', $color->id, null, $data);

        return $this->success(new ColorResource($color), 'Color created.', 201);
    }

    public function update(ColorRequest $request, Color $color)
    {
        $data = $request->validated();
        $old = $color->toArray();

        $color->update($data);

        $this->activityLog->log(request()->user(), 'updated', 'color', $color->id, $old, $data);

        return $this->success(new ColorResource($color), 'Color updated.');
    }

    public function destroy(Color $color)
    {
        $color->delete();

        $this->activityLog->log(request()->user(), 'deleted', 'color', $color->id, $color->toArray(), null);

        return $this->success(null, 'Color deleted.');
    }
}
