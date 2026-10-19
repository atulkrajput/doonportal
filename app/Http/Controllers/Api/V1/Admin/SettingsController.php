<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\PermissionName;
use App\Http\Controllers\Controller;
use App\Services\SiteSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/**
 * SEO defaults (seo.manage), social profiles and tracking IDs (settings.manage).
 */
class SettingsController extends Controller
{
    private const PERMISSIONS = [
        'seo' => PermissionName::ManageSeo,
        'social' => PermissionName::ManageSettings,
        'tracking' => PermissionName::ManageSettings,
    ];

    public function show(string $group, SiteSettings $settings): JsonResponse
    {
        $this->authorizeGroup($group);

        return response()->json(['data' => $settings->get($group)]);
    }

    public function update(Request $request, string $group, SiteSettings $settings): JsonResponse
    {
        $this->authorizeGroup($group);
        $values = $request->validate(SiteSettings::rules($group), SiteSettings::messages());

        return response()->json(['data' => $settings->update($group, $values, $request->user())]);
    }

    private function authorizeGroup(string $group): void
    {
        abort_unless(isset(self::PERMISSIONS[$group]), 404);
        Gate::authorize(self::PERMISSIONS[$group]->value);
    }
}
