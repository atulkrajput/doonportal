<?php

use App\Enums\PermissionName;
use App\Http\Controllers\Api\V1\Admin;
use App\Http\Controllers\Api\V1\AnalyticsController;
use App\Http\Controllers\Api\V1\AreaController;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Auth\PasswordResetController;
use App\Http\Controllers\Api\V1\BusinessController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\CollectionController;
use App\Http\Controllers\Api\V1\EventController;
use App\Http\Controllers\Api\V1\HomeController;
use App\Http\Controllers\Api\V1\MeController;
use App\Http\Controllers\Api\V1\PageController;
use App\Http\Controllers\Api\V1\PlaceController;
use App\Http\Controllers\Api\V1\SearchController;
use App\Http\Controllers\Api\V1\SeoController;
use App\Http\Controllers\Api\V1\StoryController;
use App\Services\SiteSettings;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->name('api.v1.')->group(function () {
    // Authentication
    Route::prefix('auth')->name('auth.')->group(function () {
        Route::middleware('throttle:auth')->group(function () {
            Route::post('register', [AuthController::class, 'register'])->name('register');
            Route::post('login', [AuthController::class, 'login'])->name('login');
            Route::post('forgot-password', [PasswordResetController::class, 'forgot'])->name('forgot-password');
            Route::post('reset-password', [PasswordResetController::class, 'reset'])->name('reset-password');
        });

        Route::middleware('auth:sanctum')->group(function () {
            Route::post('logout', [AuthController::class, 'logout'])->name('logout');
            Route::get('me', [AuthController::class, 'me'])->name('me');
        });
    });

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', [MeController::class, 'show'])->name('me.show');
        Route::patch('me', [MeController::class, 'update'])->name('me.update');
        Route::put('me/password', [MeController::class, 'updatePassword'])
            ->middleware('throttle:password')->name('me.password');
    });

    // Public discovery
    Route::get('home', HomeController::class)->name('home');
    Route::get('search', SearchController::class)->name('search');
    Route::get('seo', SeoController::class)->name('seo');
    Route::get('pages', [PageController::class, 'index'])->name('pages.index');
    Route::get('pages/{slug}', [PageController::class, 'show'])->where('slug', '[a-z0-9-]+')->name('pages.show');

    Route::controller(BusinessController::class)->prefix('businesses')->name('businesses.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('{business:slug}', 'show')->name('show');
        Route::get('{business:slug}/photos', 'photos')->name('photos');
        Route::get('{business:slug}/services', 'services')->name('services');
        Route::get('{business:slug}/offers', 'offers')->name('offers');
        Route::get('{business:slug}/reviews', 'reviews')->name('reviews');
        Route::get('{business:slug}/related', 'related')->name('related');
    });

    Route::controller(PlaceController::class)->prefix('places')->name('places.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('{place:slug}', 'show')->name('show');
        Route::get('{place:slug}/photos', 'photos')->name('photos');
        Route::get('{place:slug}/related', 'related')->name('related');
    });

    Route::controller(EventController::class)->prefix('events')->name('events.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('{event:slug}', 'show')->name('show');
        Route::get('{event:slug}/related', 'related')->name('related');
    });

    Route::controller(AreaController::class)->prefix('areas')->name('areas.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('{area:slug}', 'show')->name('show');
        Route::get('{area:slug}/businesses', 'businesses')->name('businesses');
        Route::get('{area:slug}/places', 'places')->name('places');
        Route::get('{area:slug}/events', 'events')->name('events');
        Route::get('{area:slug}/stories', 'stories')->name('stories');
    });

    Route::get('categories', [CategoryController::class, 'index'])->name('categories.index');
    Route::get('categories/{category:slug}', [CategoryController::class, 'show'])->name('categories.show');
    Route::get('stories', [StoryController::class, 'index'])->name('stories.index');
    Route::get('stories/{story:slug}', [StoryController::class, 'show'])->name('stories.show');
    Route::get('collections', [CollectionController::class, 'index'])->name('collections.index');
    Route::get('collections/{collection:slug}', [CollectionController::class, 'show'])->name('collections.show');

    Route::post('analytics/events', [AnalyticsController::class, 'store'])
        ->middleware('throttle:analytics')->name('analytics.store');

    // Admin & CMS. Records are addressed by id (ULID), not slug. Every group is
    // gated by a permission; SUPER_ADMIN passes all gates via Gate::before.
    Route::prefix('admin')->name('admin.')->middleware(['auth:sanctum', 'can:admin.access'])->group(function () {
        Route::get('dashboard', Admin\DashboardController::class)->name('dashboard');

        $content = [
            'businesses' => [Admin\BusinessController::class, 'business', PermissionName::ManageBusinesses, true],
            'places' => [Admin\PlaceController::class, 'place', PermissionName::ManagePlaces, true],
            'events' => [Admin\EventController::class, 'event', PermissionName::ManageEvents, true],
            'venues' => [Admin\VenueController::class, 'venue', PermissionName::ManageEvents, false],
            'organizers' => [Admin\OrganizerController::class, 'organizer', PermissionName::ManageEvents, false],
            'stories' => [Admin\StoryController::class, 'story', PermissionName::ManageStories, true],
            'collections' => [Admin\CollectionController::class, 'collection', PermissionName::ManageCollections, true],
            'areas' => [Admin\AreaController::class, 'area', PermissionName::ManageTaxonomy, false],
            'categories' => [Admin\CategoryController::class, 'category', PermissionName::ManageTaxonomy, false],
        ];

        foreach ($content as $uri => [$controller, $param, $permission, $hasStatus]) {
            Route::controller($controller)->prefix($uri)->name("{$uri}.")
                ->middleware('can:'.$permission->value)
                ->group(function () use ($param, $hasStatus) {
                    Route::get('/', 'index')->name('index');
                    Route::post('/', 'store')->name('store');
                    Route::get("{{$param}:id}", 'show')->name('show')->withTrashed();
                    Route::patch("{{$param}:id}", 'update')->name('update');
                    Route::delete("{{$param}:id}", 'destroy')->name('destroy');
                    Route::post("{{$param}:id}/restore", 'restore')->name('restore')->withTrashed();
                    if ($hasStatus) {
                        Route::post("{{$param}:id}/status", 'status')->name('status');
                    }
                });
        }

        Route::post('events/{event:id}/reschedule', [Admin\EventController::class, 'reschedule'])
            ->middleware('can:'.PermissionName::ManageEvents->value)->name('events.reschedule');
        Route::put('collections/{collection:id}/items', [Admin\CollectionController::class, 'items'])
            ->middleware('can:'.PermissionName::ManageCollections->value)->name('collections.items');

        Route::controller(Admin\MediaController::class)->prefix('media')->name('media.')
            ->middleware('can:media.upload')->group(function () {
                Route::get('/', 'index')->name('index');
                Route::post('/', 'store')->middleware('throttle:30,1')->name('store');
                Route::patch('{media:id}', 'update')->name('update');
            });

        Route::controller(Admin\UserController::class)->prefix('users')->name('users.')
            ->middleware('can:'.PermissionName::ManageUsers->value)->group(function () {
                Route::get('/', 'index')->name('index');
                Route::get('{user:id}', 'show')->name('show');
                Route::put('{user:id}/roles', 'updateRoles')->name('roles');
            });

        Route::get('audit-logs', [Admin\AuditLogController::class, 'index'])
            ->middleware('can:'.PermissionName::ViewAuditLogs->value)->name('audit-logs.index');

        // Monetization: plans, recorded subscriptions and revenue.
        Route::middleware('can:'.PermissionName::ManageMonetization->value)->group(function () {
            Route::controller(Admin\PlanController::class)->prefix('plans')->name('plans.')->group(function () {
                Route::get('/', 'index')->name('index');
                Route::post('/', 'store')->name('store');
                Route::get('{plan:id}', 'show')->name('show')->withTrashed();
                Route::patch('{plan:id}', 'update')->name('update');
                Route::delete('{plan:id}', 'destroy')->name('destroy');
                Route::post('{plan:id}/restore', 'restore')->name('restore')->withTrashed();
            });
            Route::controller(Admin\SubscriptionController::class)->prefix('subscriptions')->name('subscriptions.')->group(function () {
                Route::get('/', 'index')->name('index');
                Route::post('/', 'store')->name('store');
                Route::get('{subscription:id}', 'show')->name('show');
                Route::patch('{subscription:id}', 'update')->name('update');
            });
            Route::get('revenue', Admin\RevenueController::class)->name('revenue');
        });

        Route::get('analytics', Admin\AnalyticsReportController::class)
            ->middleware('can:'.PermissionName::ViewAnalytics->value)->name('analytics');

        // SEO overrides, preview and audit.
        Route::controller(Admin\SeoController::class)->prefix('seo')->name('seo.')
            ->middleware('can:'.PermissionName::ManageSeo->value)->group(function () {
                Route::get('/', 'index')->name('index');
                Route::post('/', 'store')->name('store');
                Route::get('preview', 'preview')->name('preview');
                Route::get('audit', 'audit')->name('audit');
                Route::get('entity/{type}/{id}', 'forEntity')->name('entity');
                Route::patch('{seoMeta:id}', 'update')->name('update');
                Route::delete('{seoMeta:id}', 'destroy')->name('destroy');
            });

        // Site pages (privacy, terms, about…).
        Route::controller(Admin\PageController::class)->prefix('pages')->name('pages.')
            ->middleware('can:'.PermissionName::ManagePages->value)->group(function () {
                Route::get('/', 'index')->name('index');
                Route::post('/', 'store')->name('store');
                Route::get('{page:id}', 'show')->name('show')->withTrashed();
                Route::patch('{page:id}', 'update')->name('update');
                Route::delete('{page:id}', 'destroy')->name('destroy');
                Route::post('{page:id}/restore', 'restore')->name('restore')->withTrashed();
                Route::post('{page:id}/status', 'status')->name('status');
            });

        // Settings groups: seo (seo.manage), social and tracking (settings.manage) — checked per group.
        Route::get('settings/{group}', [Admin\SettingsController::class, 'show'])->whereIn('group', SiteSettings::GROUPS)->name('settings.show');
        Route::put('settings/{group}', [Admin\SettingsController::class, 'update'])->whereIn('group', SiteSettings::GROUPS)->name('settings.update');
    });
});
