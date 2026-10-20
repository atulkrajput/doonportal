<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\RoleName;
use App\Http\Requests\Admin\AdminIndexRequest;
use App\Http\Resources\Admin\MemberResource;
use App\Models\User;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/**
 * Member accounts (users.manage), read-only. Business ownership comes from
 * approved claims and listings, never from here.
 */
class MemberController extends AdminController
{
    public function index(AdminIndexRequest $request): AnonymousResourceCollection
    {
        $memberRoles = array_values(array_diff(array_column(RoleName::cases(), 'value'), RoleName::staffValues()));
        $request->validate(['role' => ['nullable', Rule::in($memberRoles)]]);

        $query = User::query()->with('roles')->withCount(['ownedBusinesses', 'reviews'])
            ->when($request->filterValue('role'), fn ($q, $role) => $q->whereHas('roles', fn ($q) => $q->where('name', $role)));

        return MemberResource::collection($this->paginate($query, $request, ['name', 'email', 'phone'], ['name' => 'name']));
    }

    public function show(User $user): MemberResource
    {
        return new MemberResource($user->load('roles')->loadCount(['ownedBusinesses', 'reviews']));
    }
}
