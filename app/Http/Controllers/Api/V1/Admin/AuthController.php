<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StaffLoginRequest;
use App\Http\Requests\ChangePasswordRequest;
use App\Http\Resources\Admin\StaffResource;
use App\Models\Admin;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Staff sign-in, separate from members. Staff tokens are short-lived and can
 * only be used on staff routes.
 */
class AuthController extends Controller
{
    public function login(StaffLoginRequest $request, AuditLogger $audit): JsonResponse
    {
        $admin = Admin::where('email', strtolower($request->string('email')))->first();

        if (! $admin || ! Hash::check($request->string('password'), $admin->password) || ! $admin->is_active) {
            throw ValidationException::withMessages(['email' => [__('auth.failed')]]);
        }

        $admin->forceFill(['last_login_at' => now()])->save();
        $audit->log('admin.signed_in', $admin, null, null, $admin);
        $token = $admin->createToken('admin', expiresAt: now()->addHours(12));

        return response()->json([
            'token' => $token->plainTextToken,
            'user' => new StaffResource($admin->load('roles.permissions')),
        ]);
    }

    public function me(Request $request): StaffResource
    {
        return new StaffResource($request->user()->load('roles.permissions'));
    }

    public function logout(Request $request): Response
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->noContent();
    }

    /**
     * Change the signed-in staff member's password; other sessions are signed out.
     */
    public function password(ChangePasswordRequest $request, AuditLogger $audit): JsonResponse
    {
        $admin = $request->user();
        $currentTokenId = $admin->currentAccessToken()?->getKey();

        DB::transaction(function () use ($admin, $request, $currentTokenId, $audit) {
            $admin->forceFill(['password' => $request->validated('password')])->save();
            $admin->tokens()->when($currentTokenId, fn ($q) => $q->whereKeyNot($currentTokenId))->delete();
            $audit->log('admin.password_changed', $admin, null, null, $admin);
        });

        return response()->json(['message' => 'Your password has been changed. Other devices have been signed out.']);
    }
}
