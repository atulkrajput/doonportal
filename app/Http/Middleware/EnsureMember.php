<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Member routes accept only member accounts; staff use the admin area.
 */
class EnsureMember
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless($request->user() instanceof User, 403, 'Sign in with a member account to use this.');

        return $next($request);
    }
}
