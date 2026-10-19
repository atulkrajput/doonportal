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
}
