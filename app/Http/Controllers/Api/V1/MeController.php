<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\GoogleLoginRequest;
use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\Auth\GoogleIdTokenVerifier;
use App\Services\Auth\InvalidGoogleToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MeController extends Controller
{
    public function show(Request $request): UserResource
    {
        return new UserResource($request->user()->load('roles'));
    }

    public function update(UpdateProfileRequest $request): UserResource
    {
        $user = $request->user();
        $user->update($request->profile());

        return new UserResource($user->load('roles'));
    }

    /**
     * Change the signed-in user's password. Every other token (other devices and
     * sessions) is revoked; the token used for this request stays valid.
     */
    public function updatePassword(ChangePasswordRequest $request, AuditLogger $audit): JsonResponse
    {
        $user = $request->user();
        $currentTokenId = $user->currentAccessToken()?->getKey();
        $hadPassword = $user->hasPassword();

        DB::transaction(function () use ($user, $request, $currentTokenId, $audit, $hadPassword) {
            $user->forceFill(['password' => $request->validated('password')])->save();
            $user->tokens()->when($currentTokenId, fn ($q) => $q->whereKeyNot($currentTokenId))->delete();
            $audit->log($hadPassword ? 'user.password_changed' : 'user.password_set', $user, null, null, $user);
        });

        return response()->json(['message' => $hadPassword
            ? 'Your password has been changed. Other devices have been signed out.'
            : 'Your password has been set. You can now also sign in with your email and password.']);
    }

    /**
     * Link a Google account to the signed-in member, so they can sign in with
     * Google. It must use the same email and not be linked to anyone else.
     */
    public function linkGoogle(GoogleLoginRequest $request, GoogleIdTokenVerifier $google, AuditLogger $audit): UserResource
    {
        abort_unless($google->enabled(), 404);
        $user = $request->user();

        try {
            $profile = $google->verify($request->string('credential'));
        } catch (InvalidGoogleToken $e) {
            throw ValidationException::withMessages(['credential' => [$e->getMessage()]]);
        }

        if ($profile['email'] !== strtolower($user->email)) {
            throw ValidationException::withMessages(['credential' => ["Choose the Google account for {$user->email}."]]);
        }
        if (User::withTrashed()->where('google_id', $profile['sub'])->whereKeyNot($user->id)->exists()) {
            throw ValidationException::withMessages(['credential' => ['That Google account is already linked to another DoonPortal account.']]);
        }

        DB::transaction(function () use ($user, $profile, $audit) {
            $user->forceFill(['google_id' => $profile['sub'], 'email_verified_at' => $user->email_verified_at ?? now()])->save();
            $audit->log('user.google_linked', $user, null, null, $user);
        });

        return new UserResource($user->load('roles'));
    }
}
