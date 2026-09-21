<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\PrintPositionRequest;
use App\Http\Resources\PrintPositionResource;
use App\Models\PrintPosition;
use App\Services\ActivityLogService;
use Illuminate\Support\Str;

class PrintPositionController extends Controller
{
    public function __construct(protected ActivityLogService $activityLog) {}

    public function index()
    {
        return $this->success(PrintPositionResource::collection(PrintPosition::query()->orderBy('label')->get()), 'OK');
    }

    public function store(PrintPositionRequest $request)
    {
        $data = $request->validated();
        $data['slug'] = $data['slug'] ?? Str::slug($data['label']);

        $position = PrintPosition::create($data);

        $this->activityLog->log(request()->user(), 'created', 'print_position', $position->id, null, $data);

        return $this->success(new PrintPositionResource($position), 'Print position created.', 201);
    }

    public function update(PrintPositionRequest $request, PrintPosition $print_position)
    {
        $data = $request->validated();
        $old = $print_position->toArray();

        $print_position->update($data);

        $this->activityLog->log(request()->user(), 'updated', 'print_position', $print_position->id, $old, $data);

        return $this->success(new PrintPositionResource($print_position), 'Print position updated.');
    }

    public function destroy(PrintPosition $print_position)
    {
        $print_position->delete();

        $this->activityLog->log(request()->user(), 'deleted', 'print_position', $print_position->id, $print_position->toArray(), null);

        return $this->success(null, 'Print position deleted.');
    }
}
