<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Measurements\MeasurementRequest;
use App\Http\Resources\MeasurementResource;
use App\Models\Measurement;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class MeasurementController extends Controller
{
    public function index(Request $request)
    {
        $measurements = $request->user()->measurements()->orderBy('label')->get();

        return $this->success(MeasurementResource::collection($measurements), 'OK');
    }

    public function store(MeasurementRequest $request)
    {
        $exists = $request->user()->measurements()->where('label', $request->string('label'))->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'label' => ['You already have a measurement profile with this label.'],
            ]);
        }

        $measurement = $request->user()->measurements()->create($request->validated());

        return $this->success(new MeasurementResource($measurement), 'Measurement profile created.', 201);
    }

    public function update(MeasurementRequest $request, Measurement $measurement)
    {
        $this->authorizeOwnership($request, $measurement);

        $measurement->update($request->validated());

        return $this->success(new MeasurementResource($measurement->fresh()), 'Measurement profile updated.');
    }

    public function destroy(Request $request, Measurement $measurement)
    {
        $this->authorizeOwnership($request, $measurement);

        $measurement->delete();

        return $this->success(null, 'Measurement profile deleted.');
    }

    protected function authorizeOwnership(Request $request, Measurement $measurement): void
    {
        if ($measurement->user_id !== $request->user()->id) {
            abort(403, 'This action is unauthorized.');
        }
    }
}
