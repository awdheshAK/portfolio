<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\CustomerResource;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CustomerController extends Controller
{
    public function __construct(protected ActivityLogService $activityLog) {}

    public function index(Request $request)
    {
        $query = User::query()
            ->withTrashed()
            ->where('role', UserRole::Customer->value)
            ->withCount(['orders', 'designs', 'addresses', 'measurements', 'wishlists']);

        if ($search = $request->query('search')) {
            // whereRaw + LOWER() rather than `ilike` (Postgres-only) so this
            // works identically against SQLite in tests and Postgres in prod.
            $needle = '%'.mb_strtolower($search).'%';
            $query->where(fn ($q) => $q->whereRaw('LOWER(name) LIKE ?', [$needle])->orWhereRaw('LOWER(email) LIKE ?', [$needle]));
        }

        $paginator = $query->latest()->paginate(min(50, (int) $request->query('per_page', 20)));

        return $this->success([
            'data' => CustomerResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ],
        ], 'OK');
    }

    public function show(string $customer)
    {
        $user = User::query()
            ->withTrashed()
            ->withCount(['orders', 'designs', 'addresses', 'measurements', 'wishlists'])
            ->with([
                'orders' => fn ($q) => $q->latest()->limit(10),
                'addresses',
                'measurements',
            ])
            ->findOrFail($customer);

        return $this->success(new CustomerResource($user), 'OK');
    }

    public function disable(string $customer)
    {
        $user = User::query()->findOrFail($customer);

        if ($user->isAdmin()) {
            throw ValidationException::withMessages(['customer' => 'Admin accounts cannot be disabled from this screen.']);
        }

        $user->tokens()->delete();
        $user->delete();

        $this->activityLog->log(request()->user(), 'disabled', 'customer', $user->id, null, null);

        return $this->success(null, 'Customer account disabled.');
    }

    public function restore(string $customer)
    {
        $user = User::withTrashed()->findOrFail($customer);
        $user->restore();

        $this->activityLog->log(request()->user(), 'enabled', 'customer', $user->id, null, null);

        return $this->success(new CustomerResource($user), 'Customer account re-enabled.');
    }
}
