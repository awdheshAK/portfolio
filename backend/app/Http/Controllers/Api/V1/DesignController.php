<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Designs\DesignStoreRequest;
use App\Http\Requests\Designs\DesignUpdateRequest;
use App\Http\Resources\DesignResource;
use App\Models\Design;
use Illuminate\Http\Request;

class DesignController extends Controller
{
    public function index(Request $request)
    {
        $designs = $request->user()->designs()->latest()->get();

        return $this->success(DesignResource::collection($designs), 'OK');
    }

    public function store(DesignStoreRequest $request)
    {
        $design = $request->user()->designs()->create($request->validated());

        return $this->success(new DesignResource($design), 'Design saved.', 201);
    }

    public function show(Request $request, Design $design)
    {
        $this->authorize('view', $design);

        return $this->success(new DesignResource($design), 'OK');
    }

    public function update(DesignUpdateRequest $request, Design $design)
    {
        $this->authorize('update', $design);

        $design->update($request->validated());

        return $this->success(new DesignResource($design), 'Design updated.');
    }

    public function destroy(Request $request, Design $design)
    {
        $this->authorize('delete', $design);

        $design->delete();

        return $this->success(null, 'Design deleted.');
    }
}
