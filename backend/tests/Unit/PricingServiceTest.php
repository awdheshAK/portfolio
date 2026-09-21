<?php

namespace Tests\Unit;

use App\Models\Color;
use App\Models\EmbroideryPosition;
use App\Models\Fabric;
use App\Models\Garment;
use App\Models\Patch;
use App\Models\PrintPosition;
use App\Models\Size;
use App\Services\PricingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class PricingServiceTest extends TestCase
{
    use RefreshDatabase;

    protected PricingService $pricing;

    protected function setUp(): void
    {
        parent::setUp();

        $this->pricing = new PricingService;
    }

    public function test_base_garment_price_only(): void
    {
        $garment = Garment::factory()->create(['base_price_minor' => 45000]);

        $result = $this->pricing->calculate([
            'garment_id' => $garment->id,
            'quantity' => 1,
        ]);

        $this->assertSame(45000, $result['subtotal_minor']);
        $this->assertSame(45000, $result['total_minor']);
        $this->assertSame('INR', $result['currency']);
        $this->assertCount(1, $result['breakdown']);
    }

    public function test_fabric_color_and_size_deltas_are_added(): void
    {
        $garment = Garment::factory()->create(['base_price_minor' => 45000]);
        $fabric = Fabric::factory()->create(['price_delta_minor' => 25000]); // Dri-Fit-like
        $color = Color::factory()->create(['price_delta_minor' => 5000]);
        $size = Size::factory()->create(['label' => 'XL', 'price_delta_minor' => 10000]);

        $result = $this->pricing->calculate([
            'garment_id' => $garment->id,
            'fabric_id' => $fabric->id,
            'color_id' => $color->id,
            'size_id' => $size->id,
            'quantity' => 1,
        ]);

        // 45000 + 25000 + 5000 + 10000 = 85000
        $this->assertSame(85000, $result['subtotal_minor']);
        $this->assertSame(85000, $result['total_minor']);
    }

    public function test_logo_and_text_flat_fees_are_applied(): void
    {
        $garment = Garment::factory()->create(['base_price_minor' => 40000]);

        $result = $this->pricing->calculate([
            'garment_id' => $garment->id,
            'logo' => true,
            'text' => ['content' => 'JOHN'],
            'quantity' => 1,
        ]);

        $expected = 40000 + PricingService::LOGO_UPLOAD_FEE_MINOR + PricingService::TEXT_CUSTOMIZATION_FEE_MINOR;

        $this->assertSame($expected, $result['subtotal_minor']);
    }

    public function test_print_embroidery_and_patches_are_summed(): void
    {
        $garment = Garment::factory()->create(['base_price_minor' => 40000]);
        $print = PrintPosition::factory()->create(['price_minor' => 15000]);
        $embroidery = EmbroideryPosition::factory()->create(['price_minor' => 25000]);
        $patch1 = Patch::factory()->create(['price_minor' => 12000]);
        $patch2 = Patch::factory()->create(['price_minor' => 18000]);

        $result = $this->pricing->calculate([
            'garment_id' => $garment->id,
            'print' => ['position_id' => $print->id],
            'embroidery' => ['position_id' => $embroidery->id],
            'patch_ids' => [$patch1->id, $patch2->id],
            'quantity' => 1,
        ]);

        // 40000 + 15000 + 25000 + 12000 + 18000 = 110000
        $this->assertSame(110000, $result['subtotal_minor']);
    }

    public function test_full_combination_multiplies_correctly_by_quantity(): void
    {
        $garment = Garment::factory()->create(['base_price_minor' => 45000]);
        $fabric = Fabric::factory()->create(['price_delta_minor' => 25000]);
        $color = Color::factory()->create(['price_delta_minor' => 0]);
        $size = Size::factory()->create(['price_delta_minor' => 10000]);
        $print = PrintPosition::factory()->create(['price_minor' => 15000]);
        $patch = Patch::factory()->create(['price_minor' => 12000]);

        $result = $this->pricing->calculate([
            'garment_id' => $garment->id,
            'fabric_id' => $fabric->id,
            'color_id' => $color->id,
            'size_id' => $size->id,
            'logo' => true,
            'print' => ['position_id' => $print->id],
            'patch_ids' => [$patch->id],
            'quantity' => 3,
        ]);

        // unit = 45000 + 25000 + 10000 + 5000 (logo) + 15000 (print) + 12000 (patch) = 112000
        $expectedUnit = 45000 + 25000 + 10000 + PricingService::LOGO_UPLOAD_FEE_MINOR + 15000 + 12000;

        $this->assertSame($expectedUnit, $result['unit_price_minor']);
        $this->assertSame($expectedUnit, $result['subtotal_minor']);
        $this->assertSame($expectedUnit * 3, $result['total_minor']);
        $this->assertSame(3, $result['quantity']);
    }

    public function test_invalid_garment_throws_validation_exception(): void
    {
        $this->expectException(ValidationException::class);

        $this->pricing->calculate(['garment_id' => 999999, 'quantity' => 1]);
    }

    public function test_zero_price_deltas_are_omitted_from_breakdown(): void
    {
        $garment = Garment::factory()->create(['base_price_minor' => 45000]);
        $fabric = Fabric::factory()->create(['price_delta_minor' => 0]);

        $result = $this->pricing->calculate([
            'garment_id' => $garment->id,
            'fabric_id' => $fabric->id,
            'quantity' => 1,
        ]);

        // Only the base garment line should appear since the fabric delta is 0.
        $this->assertCount(1, $result['breakdown']);
        $this->assertSame(45000, $result['total_minor']);
    }
}
