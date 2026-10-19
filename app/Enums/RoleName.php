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
