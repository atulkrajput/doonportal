<?php

namespace App\Enums;

enum PermissionName: string
{
    case ManageBusinesses = 'businesses.manage';
    case ManagePlaces = 'places.manage';
    case ManageEvents = 'events.manage';
    case ManageStories = 'stories.manage';
    case ManageCollections = 'collections.manage';
    case ManageTaxonomy = 'taxonomy.manage';
    case ManageUsers = 'users.manage';
    case ModerateReviews = 'reviews.moderate';
    case ModerateSubmissions = 'submissions.moderate';
    case ManageReports = 'reports.manage';
    case ManageClaims = 'claims.manage';
    case ViewAuditLogs = 'audit.view';
    case ManageAi = 'ai.manage';
    case ManageMonetization = 'monetization.manage';
    case ViewAnalytics = 'analytics.view';
    case ManageSeo = 'seo.manage';
    case ManageSettings = 'settings.manage';

    /**
     * Permissions that edit public content (and may therefore upload media).
     *
     * @return list<self>
     */
    public static function contentManagement(): array
    {
        return [
            self::ManageBusinesses, self::ManagePlaces, self::ManageEvents,
            self::ManageStories, self::ManageCollections, self::ManageTaxonomy,
        ];
    }
}
