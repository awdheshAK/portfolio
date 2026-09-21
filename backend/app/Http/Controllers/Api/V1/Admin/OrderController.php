<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\OrderStatusUpdateRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function __construct(protected ActivityLogService $activityLog) {}

    public function index(Request $request)
    {
        $query = Order::query()->with(['items', 'user'])->latest();

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $paginator = $query->paginate(min(50, (int) $request->query('per_page', 20)));

        return $this->success([
            'data' => OrderResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ],
        ], 'OK');
    }

    public function show(Order $order)
    {
        $order->load(['items', 'user', 'payments']);

        return $this->success(new OrderResource($order), 'OK');
    }

    public function updateStatus(OrderStatusUpdateRequest $request, Order $order)
    {
        $old = $order->status;

        $order->update(['status' => $request->string('status')]);

        $this->activityLog->log(request()->user(), 'status_updated', 'order', $order->id, ['status' => $old], ['status' => $order->status]);

        return $this->success(new OrderResource($order->fresh('items')), 'Order status updated.');
    }
}
