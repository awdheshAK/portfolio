<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customizer\PriceRequest;
use App\Http\Resources\ColorResource;
use App\Http\Resources\EmbroideryPositionResource;
use App\Http\Resources\FabricResource;
use App\Http\Resources\GarmentResource;
use App\Http\Resources\PatchResource;
use App\Http\Resources\PrintPositionResource;
use App\Http\Resources\SizeResource;
use App\Models\Color;
use App\Models\EmbroideryPosition;
use App\Models\Fabric;
use App\Models\Garment;
use App\Models\Patch;
use App\Models\PrintPosition;
use App\Models\Size;
use App\Services\PricingService;

class CustomizerController extends Controller
{
    public function garments()
    {
        $garments = Garment::query()->where('is_active', true)->orderBy('name')->get();

        return $this->success(GarmentResource::collection($garments), 'OK');
    }

    public function options()
    {
        return $this->success([
            'fabrics' => FabricResource::collection(Fabric::query()->where('is_active', true)->orderBy('name')->get()),
            'colors' => ColorResource::collection(Color::query()->where('is_active', true)->orderBy('name')->get()),
            'sizes' => SizeResource::collection(Size::query()->where('is_active', true)->orderBy('sort_order')->get()),
            'print_positions' => PrintPositionResource::collection(PrintPosition::query()->where('is_active', true)->orderBy('label')->get()),
            'embroidery_positions' => EmbroideryPositionResource::collection(EmbroideryPosition::query()->where('is_active', true)->orderBy('label')->get()),
            'patches' => PatchResource::collection(Patch::query()->where('is_active', true)->orderBy('name')->get()),
        ], 'OK');
    }

    public function price(PriceRequest $request, PricingService $pricingService)
    {
        $result = $pricingService->calculate($request->validated());

        return $this->success($result, 'OK');
    }
}
