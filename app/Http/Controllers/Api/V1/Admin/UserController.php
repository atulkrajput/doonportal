<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\RoleName;
use App\Http\Requests\Admin\AdminIndexRequest;
use App\Http\Requests\Admin\UserRolesRequest;
use App\Http\Resources\Admin\AdminUserResource;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class UserController extends AdminController
{
    /** Roles only a SUPER_ADMIN may grant or revoke, and whose holders only a SUPER_ADMIN may edit. */
    private const PRIVILEGED = [RoleName::SuperAdmin->value, RoleName::Admin->value];

    public function index(AdminIndexRequest $request): AnonymousResourceCollection
    {
        $request->validate(['role' => ['nullable', Rule::enum(RoleName::class)]]);

        $query = User::query()->with('roles.permissions')
            ->when($request->filterValue('role'), fn ($q, $role) => $q->whereHas('roles', fn ($q) => $q->where('name', $role)));

        return AdminUserResource::collection($this->paginate($query, $request, ['name', 'email'], ['name' => 'name']));
    }

    public function show(User $user): AdminUserResource
    {
        return new AdminUserResource($user->load('roles.permissions'));
    }

    /**
     * Replace a user's roles. Rules:
     * - nobody may change their own roles;
     * - only a SUPER_ADMIN may grant/revoke ADMIN or SUPER_ADMIN, or edit an account that holds one;
     * - USER is the baseline role and is always kept.
     */
    public function updateRoles(UserRolesRequest $request, User $user): AdminUserResource
    {
        $actor = $request->user();

        abort_if($actor->is($user), 403, 'You cannot change your own roles.');

        $current = $user->roles()->pluck('name')->sort()->values();
        $requested = collect($request->validated('roles'))->push(RoleName::User->value)->unique()->sort()->values();

        $changed = $current->diff($requested)->merge($requested->diff($current));
        $touchesPrivileged = $changed->intersect(self::PRIVILEGED)->isNotEmpty()
            || $current->intersect(self::PRIVILEGED)->isNotEmpty();

        abort_if($touchesPrivileged && ! $actor->isSuperAdmin(), 403,
            'Only a super admin can grant or revoke administrator roles, or change an administrator\'s roles.');

        if ($changed->isNotEmpty()) {
            DB::transaction(function () use ($user, $current, $requested, $actor) {
                $ids = Role::whereIn('name', $requested)->pluck('id');
                $user->roles()->sync($ids->mapWithKeys(fn ($id) => [$id => ['created_at' => now()]])->all());

                $this->audit->log('user.roles_changed', $user,
                    ['roles' => $current->all()], ['roles' => $requested->all()], $actor);
            });
        }

        return new AdminUserResource($user->unsetRelation('roles')->load('roles.permissions'));
    }
}
