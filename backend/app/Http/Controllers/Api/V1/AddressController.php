<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Addresses\AddressRequest;
use App\Http\Resources\AddressResource;
use App\Models\Address;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AddressController extends Controller
{
    public function index(Request $request)
    {
        $addresses = $request->user()->addresses()->orderByDesc('is_default')->orderByDesc('id')->get();

        return $this->success(AddressResource::collection($addresses), 'OK');
    }

    public function store(AddressRequest $request)
    {
        $data = $request->validated();
        $data['country'] = $data['country'] ?? 'IN';

        $address = DB::transaction(function () use ($request, $data) {
            if (! empty($data['is_default'])) {
                $request->user()->addresses()->update(['is_default' => false]);
            }

            return $request->user()->addresses()->create($data);
        });

        return $this->success(new AddressResource($address), 'Address created.', 201);
    }

    public function update(AddressRequest $request, Address $address)
    {
        $this->authorize('update', $address);

        $data = $request->validated();

        DB::transaction(function () use ($request, $address, $data) {
            if (! empty($data['is_default'])) {
                $request->user()->addresses()->where('id', '!=', $address->id)->update(['is_default' => false]);
            }

            $address->update($data);
        });

        return $this->success(new AddressResource($address->fresh()), 'Address updated.');
    }

    public function destroy(Address $address)
    {
        $this->authorize('delete', $address);

        $address->delete();

        return $this->success(null, 'Address deleted.');
    }
}
