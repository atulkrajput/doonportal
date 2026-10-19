<?php

namespace App\Models;

use App\Enums\PermissionName;
use App\Enums\RoleName;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasUlids, Notifiable, SoftDeletes;

    /**
     * Roles are never mass assignable; use assignRole().
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'phone',
        'bio',
        'password',
    ];

    /**
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class)->withPivot('created_at');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function favorites(): HasMany
    {
        return $this->hasMany(Favorite::class);
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(Submission::class);
    }

    public function assignRole(RoleName ...$roles): static
    {
        $ids = Role::whereIn('name', array_map(fn (RoleName $r) => $r->value, $roles))->pluck('id');
        $this->roles()->syncWithoutDetaching(
            $ids->mapWithKeys(fn ($id) => [$id => ['created_at' => now()]])->all()
        );
        $this->unsetRelation('roles');

        return $this;
    }

    public function hasRole(RoleName ...$roles): bool
    {
        $names = array_map(fn (RoleName $r) => $r->value, $roles);

        return $this->roles->contains(fn (Role $role) => in_array($role->name, $names, true));
    }

    public function isSuperAdmin(): bool
    {
        return $this->hasRole(RoleName::SuperAdmin);
    }

    public function hasPermission(PermissionName|string $permission): bool
    {
        $name = $permission instanceof PermissionName ? $permission->value : $permission;

        return in_array($name, $this->permissionNames(), true);
    }

    /**
     * @return list<string>
     */
    public function permissionNames(): array
    {
        $this->loadMissing('roles.permissions');

        return $this->roles->flatMap->permissions->pluck('name')->unique()->values()->all();
    }
}
