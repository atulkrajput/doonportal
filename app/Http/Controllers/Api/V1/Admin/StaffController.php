<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\RoleName;
use App\Http\Requests\Admin\AdminIndexRequest;
use App\Http\Requests\Admin\StaffRequest;
use App\Http\Requests\Admin\UserRolesRequest;
use App\Http\Resources\Admin\StaffResource;
use App\Models\Admin;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/**
 * DoonPortal team accounts (users.manage). Guards:
 * - nobody changes their own roles, password (here) or active status;
 * - only a SUPER_ADMIN creates, edits, deactivates or resets an ADMIN or
 *   SUPER_ADMIN, or grants/revokes those roles.
 */
class StaffController extends AdminController
{
    /** Roles only a SUPER_ADMIN may grant or revoke, and whose holders only a SUPER_ADMIN may manage. */
    private const PRIVILEGED = [RoleName::SuperAdmin->value, RoleName::Admin->value];

    public function index(AdminIndexRequest $request): AnonymousResourceCollection
    {
        $request->validate(['role' => ['nullable', Rule::in(RoleName::staffValues())]]);

        $query = Admin::query()->with('roles.permissions')
            ->when($request->filterValue('role'), fn ($q, $role) => $q->whereHas('roles', fn ($q) => $q->where('name', $role)));

        return StaffResource::collection($this->paginate($query, $request, ['name', 'email'], ['name' => 'name']));
    }

    public function show(Admin $admin): StaffResource
    {
        return new StaffResource($admin->load('roles.permissions'));
    }

    public function store(StaffRequest $request): StaffResource
    {
        $roles = collect($request->validated('roles'));
        abort_if($roles->intersect(self::PRIVILEGED)->isNotEmpty() && ! $request->user()->isSuperAdmin(), 403,
            'Only a super admin can create administrators.');

        $admin = DB::transaction(function () use ($request, $roles) {
            $admin = Admin::create($request->safe()->only(['name', 'email', 'phone', 'password']));
            $admin->assignRole(...$roles->map(fn ($r) => RoleName::from($r)));
            $this->audit->log('admin.created', $admin, null, ['name' => $admin->name, 'email' => $admin->email, 'roles' => $roles->values()->all()]);

            return $admin;
        });

        return new StaffResource($admin->load('roles.permissions'));
    }

    public function update(StaffRequest $request, Admin $admin): StaffResource
    {
        $this->guardManage($request, $admin);
        $this->saveAudited($admin, $request->safe()->only(['name', 'email', 'phone']));

        return new StaffResource($admin->load('roles.permissions'));
    }

    public function updateRoles(UserRolesRequest $request, Admin $admin): StaffResource
    {
        $actor = $request->user();
        abort_if($actor->is($admin), 403, 'You cannot change your own roles.');

        $current = $admin->roles()->pluck('name')->sort()->values();
        $requested = collect($request->validated('roles'))->unique()->sort()->values();
        abort_if($requested->isEmpty(), 422, 'A staff account needs at least one role. Deactivate it instead.');

        $changed = $current->diff($requested)->merge($requested->diff($current));
        $touchesPrivileged = $changed->intersect(self::PRIVILEGED)->isNotEmpty() || $current->intersect(self::PRIVILEGED)->isNotEmpty();
        abort_if($touchesPrivileged && ! $actor->isSuperAdmin(), 403,
            'Only a super admin can grant or revoke administrator roles, or change an administrator\'s roles.');

        if ($changed->isNotEmpty()) {
            DB::transaction(function () use ($admin, $current, $requested, $actor) {
                $ids = Role::whereIn('name', $requested)->pluck('id');
                $admin->roles()->sync($ids->mapWithKeys(fn ($id) => [$id => ['created_at' => now()]])->all());
                $this->audit->log('admin.roles_changed', $admin, ['roles' => $current->all()], ['roles' => $requested->all()], $actor);
            });
        }

        return new StaffResource($admin->unsetRelation('roles')->load('roles.permissions'));
    }

    /**
     * Set a new password for a staff member (e.g. forgotten); their sessions end.
     */
    public function resetPassword(Request $request, Admin $admin): StaffResource
    {
        $this->guardManage($request, $admin);
        abort_if($request->user()->is($admin), 403, 'Change your own password from My account.');
        $data = $request->validate(['password' => ['required', 'string', 'confirmed', Password::defaults()]]);

        DB::transaction(function () use ($admin, $data) {
            $admin->forceFill(['password' => $data['password']])->save();
            $admin->tokens()->delete();
            $this->audit->log('admin.password_reset', $admin);
        });

        return new StaffResource($admin->load('roles.permissions'));
    }

    /**
     * Deactivate (sign out everywhere, block sign-in) or reactivate a staff account.
     */
    public function setActive(Request $request, Admin $admin): StaffResource
    {
        $this->guardManage($request, $admin);
        abort_if($request->user()->is($admin), 403, 'You cannot deactivate your own account.');
        $active = (bool) $request->validate(['is_active' => ['required', 'boolean']])['is_active'];

        if ($admin->is_active !== $active) {
            DB::transaction(function () use ($admin, $active) {
                $admin->forceFill(['is_active' => $active])->save();
                if (! $active) {
                    $admin->tokens()->delete();
                }
                $this->audit->log($active ? 'admin.reactivated' : 'admin.deactivated', $admin);
            });
        }

        return new StaffResource($admin->load('roles.permissions'));
    }

    private function guardManage(Request $request, Admin $admin): void
    {
        $privileged = $admin->roles()->whereIn('name', self::PRIVILEGED)->exists();
        abort_if($privileged && ! $request->user()->isSuperAdmin() && ! $request->user()->is($admin), 403,
            'Only a super admin can manage an administrator\'s account.');
    }
}
