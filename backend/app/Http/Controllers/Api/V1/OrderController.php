<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Orders\CheckoutRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\CartService;
use App\Services\OrderService;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function __construct(
        protected OrderService $orderService,
        protected CartService $cartService,
    ) {}

    public function checkout(CheckoutRequest $request)
    {
        $user = $request->user();
        $guestToken = $request->header('X-Guest-Cart-Token');
        $cart = $this->cartService->resolveCart($user, $guestToken, false);

        $result = $this->orderService->checkout($user, $cart, $request->validated());

        return $this->success([
            'order' => new OrderResource($result['order']),
            'razorpay_order_id' => $result['razorpay_order_id'],
            'razorpay_key_id' => $result['razorpay_key_id'],
            'amount_minor' => $result['amount_minor'],
            'currency' => $result['currency'],
        ], 'Order created. Proceed to payment.', 201);
    }

    public function index(Request $request)
    {
        $orders = $request->user()->orders()->with('items')->latest()->get();

        return $this->success(OrderResource::collection($orders), 'OK');
    }

    public function show(Request $request, Order $order)
    {
        $this->authorize('view', $order);

        $order->load('items');

        return $this->success(new OrderResource($order), 'OK');
    }
}
