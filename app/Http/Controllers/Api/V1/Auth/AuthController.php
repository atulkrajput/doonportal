<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Enums\RoleName;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\GoogleLoginRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\Auth\GoogleIdTokenVerifier;
use App\Services\Auth\InvalidGoogleToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = DB::transaction(function () use ($request) {
            $user = User::create($request->account());
            $user->assignRole(RoleName::User);

            return $user;
        });

        return $this->tokenResponse($user, $request->input('device_name'), 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', strtolower($request->string('email')))->first();

        // Hash::check() is false for Google-only accounts, which have no password.
        if (! $user || ! Hash::check($request->string('password'), $user->password)) {
            throw ValidationException::withMessages([
                'email' => [__('auth.failed')],
            ]);
        }

        return $this->tokenResponse($user, $request->input('device_name'));
    }

    /**
     * Sign in (or sign up) with a Google ID token. An existing account with the
     * same email is linked to the Google account.
     */
    public function google(GoogleLoginRequest $request, GoogleIdTokenVerifier $google, AuditLogger $audit): JsonResponse
    {
        if (! $google->enabled()) {
            abort(404);
        }

        try {
            $profile = $google->verify($request->string('credential'));
        } catch (InvalidGoogleToken $e) {
            throw ValidationException::withMessages(['credential' => [$e->getMessage()]]);
        }

        [$user, $created] = DB::transaction(function () use ($profile, $audit) {
            $user = User::where('google_id', $profile['sub'])->first();
            if ($user) {
                return [$user, false];
            }

            $user = User::withTrashed()->where('email', $profile['email'])->first();
            if ($user?->trashed()) {
                throw ValidationException::withMessages(['credential' => ['This account has been closed. Contact us if you think this is a mistake.']]);
            }

            if ($user) {
                $updates = ['google_id' => $profile['sub']];

                // Nobody had proved they own this email. Whoever set the password may not
                // be the address's owner, so the password and existing sessions go:
                // Google has just proved ownership.
                if ($user->email_verified_at === null) {
                    $updates += ['email_verified_at' => now(), 'password' => null];
                    $user->tokens()->delete();
                }

                $user->forceFill($updates)->save();
                $audit->log('user.google_linked', $user, null, null, $user);

                return [$user, false];
            }

            $user = new User(['name' => $profile['name'], 'email' => $profile['email']]);
            $user->forceFill(['google_id' => $profile['sub'], 'email_verified_at' => now()])->save();
            $user->assignRole(RoleName::User);

            return [$user, true];
        });

        return $this->tokenResponse($user, $request->input('device_name'), $created ? 201 : 200);
    }

    public function logout(Request $request): Response
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->noContent();
    }

    public function me(Request $request): UserResource
    {
        return new UserResource($request->user()->load('roles'));
    }

    private function tokenResponse(User $user, ?string $deviceName, int $status = 200): JsonResponse
    {
        $token = $user->createToken($deviceName ?: 'web', expiresAt: now()->addDays(30));

        return response()->json([
            'token' => $token->plainTextToken,
            'user' => new UserResource($user->load('roles')),
        ], $status);
    }
}
