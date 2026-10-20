<?php

namespace App\Enums;

enum RoleName: string
{
    case SuperAdmin = 'SUPER_ADMIN';
    case Admin = 'ADMIN';
    case Editor = 'EDITOR';
    case Moderator = 'MODERATOR';
    case BusinessOwner = 'BUSINESS_OWNER';
    case Contributor = 'CONTRIBUTOR';
    case User = 'USER';

    /**
     * Roles held by DoonPortal staff accounts (admins table). The rest are member roles.
     *
     * @return list<self>
     */
    public static function staff(): array
    {
        return [self::SuperAdmin, self::Admin, self::Editor, self::Moderator];
    }

    /**
     * @return list<string>
     */
    public static function staffValues(): array
    {
        return array_map(fn (self $r) => $r->value, self::staff());
    }

    public function isStaff(): bool
    {
        return in_array($this, self::staff(), true);
    }

    public function label(): string
    {
        return ucwords(strtolower(str_replace('_', ' ', $this->value)));
    }

    /**
     * Permissions granted to each role. SUPER_ADMIN also bypasses checks via Gate::before.
     *
     * @return list<PermissionName>
     */
    public function permissions(): array
    {
        return match ($this) {
            self::SuperAdmin, self::Admin => PermissionName::cases(),
            self::Editor => [
                PermissionName::ManageBusinesses,
                PermissionName::ManagePlaces,
                PermissionName::ManageEvents,
                PermissionName::ManageStories,
                PermissionName::ManageCollections,
                PermissionName::ManageTaxonomy,
                PermissionName::ManageSeo,
                PermissionName::ViewAnalytics,
            ],
            self::Moderator => [
                PermissionName::ModerateReviews,
                PermissionName::ModerateSubmissions,
                PermissionName::ManageReports,
                PermissionName::ManageClaims,
            ],
            self::BusinessOwner, self::Contributor, self::User => [],
        };
    }
}
