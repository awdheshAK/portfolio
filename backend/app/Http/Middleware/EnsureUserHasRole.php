<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Narrows an admin route to a specific subset of admin roles, e.g.
 * `->middleware('role:super_admin,admin,content_manager')`.
 *
 * This runs in addition to (never instead of) the `admin` middleware, which
 * only checks "is this any kind of admin". Authorization is enforced here on
 * the backend — the frontend nav hides links a role can't use for UX, but
 * that hiding is not what protects these routes.
 */
class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user || ! in_array($user->role, $roles, true)) {
            return response()->json([
                'success' => false,
                'message' => 'This action is unauthorized for your role.',
            ], 403);
        }

        return $next($request);
    }
}
