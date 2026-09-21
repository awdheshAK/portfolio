<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CouponRequest;
use App\Http\Resources\CouponResource;
use App\Models\Coupon;
use App\Services\ActivityLogService;

class CouponController extends Controller
{
    public function __construct(protected ActivityLogService $activityLog) {}

    public function index()
    {
        return $this->success(CouponResource::collection(Coupon::query()->latest()->get()), 'OK');
    }

    public function store(CouponRequest $request)
    {
        $data = $request->validated();
        $data['code'] = strtoupper($data['code']);

        $coupon = Coupon::create($data);

        $this->activityLog->log(request()->user(), 'created', 'coupon', $coupon->id, null, $data);

        return $this->success(new CouponResource($coupon), 'Coupon created.', 201);
    }

    public function update(CouponRequest $request, Coupon $coupon)
    {
        $data = $request->validated();

        if (isset($data['code'])) {
            $data['code'] = strtoupper($data['code']);
        }

        $old = $coupon->toArray();

        $coupon->update($data);

        $this->activityLog->log(request()->user(), 'updated', 'coupon', $coupon->id, $old, $data);

        return $this->success(new CouponResource($coupon), 'Coupon updated.');
    }

    public function destroy(Coupon $coupon)
    {
        $coupon->delete();

        $this->activityLog->log(request()->user(), 'deleted', 'coupon', $coupon->id, $coupon->toArray(), null);

        return $this->success(null, 'Coupon deleted.');
    }
}
