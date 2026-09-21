<?php

use App\Http\Controllers\Api\V1\AddressController;
use App\Http\Controllers\Api\V1\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Api\V1\Admin\CollectionController as AdminCollectionController;
use App\Http\Controllers\Api\V1\Admin\ColorController as AdminColorController;
use App\Http\Controllers\Api\V1\Admin\CouponController as AdminCouponController;
use App\Http\Controllers\Api\V1\Admin\CustomerController as AdminCustomerController;
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
use App\Http\Controllers\Api\V1\ContactController;
use App\Http\Controllers\Api\V1\CustomizerController;
use App\Http\Controllers\Api\V1\DesignController;
use App\Http\Controllers\Api\V1\FabricController;
use App\Http\Controllers\Api\V1\MeasurementController;
use App\Http\Controllers\Api\V1\NewsletterController;
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
        Route::post('register', [AuthController::class, 'register'])->middleware('throttle:10,1,register');
        Route::post('login', [AuthController::class, 'login'])->middleware('throttle:10,1,login');
        Route::post('logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
        Route::get('me', [AuthController::class, 'me'])->middleware('auth:sanctum');
        Route::post('forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1,forgot-password');
        Route::post('reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1,reset-password');
    });

    // Contact / Newsletter
    // NOTE: the trailing name segment on `throttle:max,decay,name` is required —
    // without it, Laravel's basic throttle middleware keys its counter by
    // domain+IP alone, so every route using the same bare "N,1" pair would
    // otherwise share one global bucket per visitor.
    Route::post('contact', [ContactController::class, 'store'])->middleware('throttle:5,1,contact');
    Route::post('newsletter/subscribe', [NewsletterController::class, 'subscribe'])->middleware('throttle:5,1,newsletter');

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

    // Measurement profiles (auth)
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('measurements', [MeasurementController::class, 'index']);
        Route::post('measurements', [MeasurementController::class, 'store']);
        Route::put('measurements/{measurement}', [MeasurementController::class, 'update']);
        Route::delete('measurements/{measurement}', [MeasurementController::class, 'destroy']);
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
    //
    // Every route here is already behind `admin` (any of the 5 admin roles).
    // The `role:` middleware further narrows specific sub-resources to the
    // roles that should actually manage them — this is real backend
    // enforcement, not just a hidden button in the UI. The frontend nav
    // mirrors this same mapping so a role never sees a link it can't use,
    // but the mirroring is a UX convenience; these middleware are what
    // actually stop the request.
    Route::prefix('admin')->middleware(['auth:sanctum', 'admin'])->group(function () {
        // Every admin role can see the overview.
        Route::get('dashboard', [DashboardController::class, 'index']);

        // Catalog & customizer configuration: content-focused roles.
        Route::middleware('role:super_admin,admin,content_manager')->group(function () {
            Route::apiResource('products', AdminProductController::class)->except(['show']);
            Route::apiResource('categories', AdminCategoryController::class)->except(['show']);
            Route::apiResource('collections', AdminCollectionController::class)->except(['show']);

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
        });

        // Orders: fulfilment-focused roles (production needs visibility too).
        Route::middleware('role:super_admin,admin,order_manager,production_manager')->group(function () {
            Route::get('orders', [AdminOrderController::class, 'index']);
            Route::get('orders/{order}', [AdminOrderController::class, 'show']);
            Route::patch('orders/{order}/status', [AdminOrderController::class, 'updateStatus']);
        });

        // Coupons & customers: commercial/order-management roles.
        Route::middleware('role:super_admin,admin,order_manager')->group(function () {
            Route::apiResource('coupons', AdminCouponController::class)->except(['show']);

            Route::prefix('customers')->group(function () {
                Route::get('/', [AdminCustomerController::class, 'index']);
                Route::get('{customer}', [AdminCustomerController::class, 'show']);
                Route::delete('{customer}', [AdminCustomerController::class, 'disable']);
                Route::post('{customer}/restore', [AdminCustomerController::class, 'restore']);
            });
        });
    });
});
