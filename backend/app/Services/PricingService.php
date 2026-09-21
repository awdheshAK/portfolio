<?php

namespace App\Services;

use App\Models\Color;
use App\Models\EmbroideryPosition;
use App\Models\Fabric;
use App\Models\Garment;
use App\Models\Patch;
use App\Models\PrintPosition;
use App\Models\Size;
use Illuminate\Validation\ValidationException;

/**
 * The single source of truth for computing the price of a customized garment.
 *
 * The frontend never computes a final price itself — every price shown to a
 * customer (the /customizer/price preview, cart line items, and order totals)
 * is produced by this service from data stored in the database. Client-sent
 * price fields are always ignored.
 */
class PricingService
{
    /**
     * Flat fee (in paise) charged when the customer uploads a custom logo asset.
     */
    public const LOGO_UPLOAD_FEE_MINOR = 5000;

    /**
     * Flat fee (in paise) charged when the customer adds custom text (e.g. a name/number).
     */
    public const TEXT_CUSTOMIZATION_FEE_MINOR = 3000;

    public const CURRENCY = 'INR';

    /**
     * Calculate the price for a customizer configuration.
     *
     * Expected shape of $config (matches POST /api/v1/customizer/price):
     * [
     *   'garment_id' => int,
     *   'fabric_id' => int|null,
     *   'color_id' => int|null,
     *   'size_id' => int|null,
     *   'logo' => bool,
     *   'text' => array|null,
     *   'print' => ['position_id' => int]|null,
     *   'embroidery' => ['position_id' => int]|null,
     *   'patch_ids' => int[],
     *   'quantity' => int,
     * ]
     *
     * @return array{subtotal_minor: int, breakdown: array<int, array{label: string, amount_minor: int}>, total_minor: int, currency: string, unit_price_minor: int, quantity: int}
     */
    public function calculate(array $config): array
    {
        $quantity = max(1, (int) ($config['quantity'] ?? 1));

        $garment = Garment::query()->where('is_active', true)->find($config['garment_id'] ?? null);

        if (! $garment) {
            throw ValidationException::withMessages([
                'garment_id' => ['The selected garment is invalid.'],
            ]);
        }

        $breakdown = [];

        $breakdown[] = [
            'label' => "Base garment: {$garment->name}",
            'amount_minor' => $garment->base_price_minor,
        ];

        if (! empty($config['fabric_id'])) {
            /** @var Fabric|null $fabric */
            $fabric = Fabric::query()->where('is_active', true)->find($config['fabric_id']);

            if (! $fabric) {
                throw ValidationException::withMessages(['fabric_id' => ['The selected fabric is invalid.']]);
            }

            if ($fabric->price_delta_minor !== 0) {
                $breakdown[] = [
                    'label' => "Fabric: {$fabric->name}",
                    'amount_minor' => $fabric->price_delta_minor,
                ];
            }
        }

        if (! empty($config['color_id'])) {
            /** @var Color|null $color */
            $color = Color::query()->where('is_active', true)->find($config['color_id']);

            if (! $color) {
                throw ValidationException::withMessages(['color_id' => ['The selected color is invalid.']]);
            }

            if ($color->price_delta_minor !== 0) {
                $breakdown[] = [
                    'label' => "Color: {$color->name}",
                    'amount_minor' => $color->price_delta_minor,
                ];
            }
        }

        if (! empty($config['size_id'])) {
            /** @var Size|null $size */
            $size = Size::query()->where('is_active', true)->find($config['size_id']);

            if (! $size) {
                throw ValidationException::withMessages(['size_id' => ['The selected size is invalid.']]);
            }

            if ($size->price_delta_minor !== 0) {
                $breakdown[] = [
                    'label' => "Size: {$size->label}",
                    'amount_minor' => $size->price_delta_minor,
                ];
            }
        }

        if (! empty($config['logo'])) {
            $breakdown[] = [
                'label' => 'Custom logo upload',
                'amount_minor' => self::LOGO_UPLOAD_FEE_MINOR,
            ];
        }

        if (! empty($config['text']) && is_array($config['text'])) {
            $breakdown[] = [
                'label' => 'Custom text',
                'amount_minor' => self::TEXT_CUSTOMIZATION_FEE_MINOR,
            ];
        }

        if (! empty($config['print']['position_id'] ?? null)) {
            /** @var PrintPosition|null $position */
            $position = PrintPosition::query()->where('is_active', true)->find($config['print']['position_id']);

            if (! $position) {
                throw ValidationException::withMessages(['print.position_id' => ['The selected print position is invalid.']]);
            }

            $breakdown[] = [
                'label' => "Print: {$position->label}",
                'amount_minor' => $position->price_minor,
            ];
        }

        if (! empty($config['embroidery']['position_id'] ?? null)) {
            /** @var EmbroideryPosition|null $position */
            $position = EmbroideryPosition::query()->where('is_active', true)->find($config['embroidery']['position_id']);

            if (! $position) {
                throw ValidationException::withMessages(['embroidery.position_id' => ['The selected embroidery position is invalid.']]);
            }

            $breakdown[] = [
                'label' => "Embroidery: {$position->label}",
                'amount_minor' => $position->price_minor,
            ];
        }

        $patchIds = array_filter(array_unique($config['patch_ids'] ?? []));

        if (! empty($patchIds)) {
            $patches = Patch::query()->where('is_active', true)->whereIn('id', $patchIds)->get();

            if ($patches->count() !== count($patchIds)) {
                throw ValidationException::withMessages(['patch_ids' => ['One or more selected patches are invalid.']]);
            }

            foreach ($patches as $patch) {
                $breakdown[] = [
                    'label' => "Patch: {$patch->name}",
                    'amount_minor' => $patch->price_minor,
                ];
            }
        }

        $unitPriceMinor = array_sum(array_column($breakdown, 'amount_minor'));
        $subtotalMinor = $unitPriceMinor;
        $totalMinor = $unitPriceMinor * $quantity;

        return [
            'subtotal_minor' => $subtotalMinor,
            'breakdown' => $breakdown,
            'unit_price_minor' => $unitPriceMinor,
            'quantity' => $quantity,
            'total_minor' => $totalMinor,
            'currency' => self::CURRENCY,
        ];
    }
}
