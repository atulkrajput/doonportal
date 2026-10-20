<?php

namespace App\Http\Middleware;

use App\Models\Admin;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Staff routes accept only active staff accounts; a member's token gets 403.
 */
class EnsureStaff
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        abort_unless($user instanceof Admin, 403, 'This area is for DoonPortal staff.');
        abort_unless($user->is_active, 403, 'This staff account has been deactivated.');

        return $next($request);
    }
}
