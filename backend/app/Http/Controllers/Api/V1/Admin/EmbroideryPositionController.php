<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\EmbroideryPositionRequest;
use App\Http\Resources\EmbroideryPositionResource;
use App\Models\EmbroideryPosition;
use App\Services\ActivityLogService;
use Illuminate\Support\Str;

class EmbroideryPositionController extends Controller
{
    public function __construct(protected ActivityLogService $activityLog) {}

    public function index()
    {
        return $this->success(EmbroideryPositionResource::collection(EmbroideryPosition::query()->orderBy('label')->get()), 'OK');
    }

    public function store(EmbroideryPositionRequest $request)
    {
        $data = $request->validated();
        $data['slug'] = $data['slug'] ?? Str::slug($data['label']);

        $position = EmbroideryPosition::create($data);

        $this->activityLog->log(request()->user(), 'created', 'embroidery_position', $position->id, null, $data);

        return $this->success(new EmbroideryPositionResource($position), 'Embroidery position created.', 201);
    }

    public function update(EmbroideryPositionRequest $request, EmbroideryPosition $embroidery_position)
    {
        $data = $request->validated();
        $old = $embroidery_position->toArray();

        $embroidery_position->update($data);

        $this->activityLog->log(request()->user(), 'updated', 'embroidery_position', $embroidery_position->id, $old, $data);

        return $this->success(new EmbroideryPositionResource($embroidery_position), 'Embroidery position updated.');
    }

    public function destroy(EmbroideryPosition $embroidery_position)
    {
        $embroidery_position->delete();

        $this->activityLog->log(request()->user(), 'deleted', 'embroidery_position', $embroidery_position->id, $embroidery_position->toArray(), null);

        return $this->success(null, 'Embroidery position deleted.');
    }
}
