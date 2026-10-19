<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MeController extends Controller
{
    public function show(Request $request): UserResource
    {
        return new UserResource($request->user()->load('roles'));
    }

    public function update(UpdateProfileRequest $request): UserResource
    {
        $user = $request->user();
        $user->update($request->validated());

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

        DB::transaction(function () use ($user, $request, $currentTokenId, $audit) {
            $user->forceFill(['password' => $request->validated('password')])->save();
            $user->tokens()->when($currentTokenId, fn ($q) => $q->whereKeyNot($currentTokenId))->delete();
            $audit->log('user.password_changed', $user, null, null, $user);
        });

        return response()->json(['message' => 'Your password has been changed. Other devices have been signed out.']);
    }
}
