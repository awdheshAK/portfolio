<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\OrderStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Http\Resources\ProductResource;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;

class DashboardController extends Controller
{
    public const LOW_STOCK_THRESHOLD = 5;

    public function index()
    {
        $excludedFromRevenue = [OrderStatus::PendingPayment->value, OrderStatus::Cancelled->value];

        $revenueMinor = (int) Order::query()->whereNotIn('status', $excludedFromRevenue)->sum('total_minor');
        $ordersCount = Order::query()->count();
        $pendingOrdersCount = Order::query()->where('status', OrderStatus::PendingPayment->value)->count();
        $customersCount = User::query()->where('role', UserRole::Customer->value)->count();
        $productsCount = Product::query()->count();

        $lowStock = Product::query()
            ->whereHas('variants', fn ($q) => $q->where('stock', '<=', self::LOW_STOCK_THRESHOLD))
            ->with(['variants' => fn ($q) => $q->where('stock', '<=', self::LOW_STOCK_THRESHOLD)])
            ->limit(10)
            ->get();

        $lowStock->each(fn (Product $product) => $product->variants->each(
            fn ($variant) => $variant->setRelation('product', $product)
        ));

        $recentOrders = Order::query()->with('items')->latest()->limit(10)->get();

        return $this->success([
            'revenue_minor' => $revenueMinor,
            'orders_count' => $ordersCount,
            'pending_orders_count' => $pendingOrdersCount,
            'customers_count' => $customersCount,
            'products_count' => $productsCount,
            'low_stock' => ProductResource::collection($lowStock),
            'recent_orders' => OrderResource::collection($recentOrders),
        ], 'OK');
    }
}
