<?php

use App\Http\Controllers\Api\V1\AddressController;
use App\Http\Controllers\Api\V1\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Api\V1\Admin\ColorController as AdminColorController;
use App\Http\Controllers\Api\V1\Admin\CouponController as AdminCouponController;
use App\Http\Controllers\Api\V1\Admin\DashboardController;
use App\Http\Controllers\Api\V1\Admin\EmbroideryPositionController as AdminEmbroideryPositionController;
use App\Http\Controllers\Api\V1\Admin\FabricController as AdminFabricController;
use App\Http\Controllers\Api\V1\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Api\V1\Admin\PatchController as AdminPatchController;
use App\Http\Controllers\Api\V1\Admin\PrintPositionController as AdminPrintPositionController;
use App\Http\Controllers\Api\V1\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Api\V1\Admin\SizeController as AdminSizeController;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\CartController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\CollectionController;
use App\Http\Controllers\Api\V1\CustomizerController;
use App\Http\Controllers\Api\V1\DesignController;
use App\Http\Controllers\Api\V1\FabricController;
use App\Http\Controllers\Api\V1\OrderController;
use App\Http\Controllers\Api\V1\PaymentController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\ReviewController;
use App\Http\Controllers\Api\V1\UploadController;
use App\Http\Controllers\Api\V1\WishlistController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // Auth
    Route::prefix('auth')->group(function () {
        Route::post('register', [AuthController::class, 'register'])->middleware('throttle:10,1');
        Route::post('login', [AuthController::class, 'login'])->middleware('throttle:10,1');
        Route::post('logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
        Route::get('me', [AuthController::class, 'me'])->middleware('auth:sanctum');
    });

    // Catalog
    Route::get('categories', [CategoryController::class, 'index']);
    Route::get('products', [ProductController::class, 'index']);
    Route::get('products/{slug}', [ProductController::class, 'show']);
    Route::get('fabrics', [FabricController::class, 'index']);
    Route::get('fabrics/{slug}', [FabricController::class, 'show']);
    Route::get('collections', [CollectionController::class, 'index']);
    Route::get('collections/{slug}', [CollectionController::class, 'show']);

    // Reviews (nested under products)
    Route::get('products/{product}/reviews', [ReviewController::class, 'index']);
    Route::post('products/{product}/reviews', [ReviewController::class, 'store'])->middleware('auth:sanctum');

    // Customizer
    Route::prefix('customizer')->group(function () {
        Route::get('garments', [CustomizerController::class, 'garments']);
        Route::get('options', [CustomizerController::class, 'options']);
        Route::post('price', [CustomizerController::class, 'price']);
    });

    // Designs (auth required)
    Route::prefix('designs')->middleware('auth:sanctum')->group(function () {
        Route::get('/', [DesignController::class, 'index']);
        Route::post('/', [DesignController::class, 'store']);
        Route::get('{design}', [DesignController::class, 'show']);
        Route::put('{design}', [DesignController::class, 'update']);
        Route::delete('{design}', [DesignController::class, 'destroy']);
    });

    // Uploads
    Route::post('uploads/design-asset', [UploadController::class, 'designAsset']);

    // Cart (auth OR guest token header — resolved inside the controller)
    Route::prefix('cart')->group(function () {
        Route::get('/', [CartController::class, 'show']);
        Route::post('items', [CartController::class, 'addItem']);
        Route::patch('items/{item}', [CartController::class, 'updateItem']);
        Route::delete('items/{item}', [CartController::class, 'removeItem']);
        Route::post('coupon', [CartController::class, 'applyCoupon']);
        Route::delete('coupon', [CartController::class, 'removeCoupon']);
    });

    // Addresses (auth)
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('addresses', [AddressController::class, 'index']);
        Route::post('addresses', [AddressController::class, 'store']);
        Route::put('addresses/{address}', [AddressController::class, 'update']);
        Route::delete('addresses/{address}', [AddressController::class, 'destroy']);
    });

    // Orders / Checkout
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('orders/checkout', [OrderController::class, 'checkout']);
        Route::get('orders', [OrderController::class, 'index']);
        Route::get('orders/{order}', [OrderController::class, 'show']);
    });

    // Payments
    Route::post('payments/razorpay/verify', [PaymentController::class, 'verify'])->middleware('auth:sanctum');
    Route::post('payments/razorpay/webhook', [PaymentController::class, 'webhook']);

    // Wishlist (auth)
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('wishlist', [WishlistController::class, 'index']);
        Route::post('wishlist', [WishlistController::class, 'store']);
        Route::delete('wishlist/{product}', [WishlistController::class, 'destroy']);
    });

    // Admin
    Route::prefix('admin')->middleware(['auth:sanctum', 'admin'])->group(function () {
        Route::get('dashboard', [DashboardController::class, 'index']);

        Route::apiResource('products', AdminProductController::class)->except(['show']);
        Route::apiResource('categories', AdminCategoryController::class)->except(['show']);

        Route::prefix('customizer')->group(function () {
            Route::apiResource('fabrics', AdminFabricController::class)->except(['show']);
            Route::apiResource('colors', AdminColorController::class)->except(['show']);
            Route::apiResource('sizes', AdminSizeController::class)->except(['show']);
            Route::apiResource('print-positions', AdminPrintPositionController::class)
                ->parameters(['print-positions' => 'print_position'])
                ->except(['show']);
            Route::apiResource('embroidery-positions', AdminEmbroideryPositionController::class)
                ->parameters(['embroidery-positions' => 'embroidery_position'])
                ->except(['show']);
            Route::apiResource('patches', AdminPatchController::class)->except(['show']);
        });

        Route::get('orders', [AdminOrderController::class, 'index']);
        Route::get('orders/{order}', [AdminOrderController::class, 'show']);
        Route::patch('orders/{order}/status', [AdminOrderController::class, 'updateStatus']);

        Route::apiResource('coupons', AdminCouponController::class)->except(['show']);
    });
});
