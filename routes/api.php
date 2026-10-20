<?php

use App\Enums\PermissionName;
use App\Http\Controllers\Api\V1\Account;
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
            Route::post('google', [AuthController::class, 'google'])->name('google');
            Route::post('forgot-password', [PasswordResetController::class, 'forgot'])->name('forgot-password');
            Route::post('reset-password', [PasswordResetController::class, 'reset'])->name('reset-password');
        });

        Route::middleware(['auth:sanctum', 'member'])->group(function () {
            Route::post('logout', [AuthController::class, 'logout'])->name('logout');
            Route::get('me', [AuthController::class, 'me'])->name('me');
        });
    });

    // Member account routes. Staff accounts use /admin and are refused here.
    Route::middleware(['auth:sanctum', 'member'])->group(function () {
        Route::get('me', [MeController::class, 'show'])->name('me.show');
        Route::patch('me', [MeController::class, 'update'])->name('me.update');
        Route::put('me/password', [MeController::class, 'updatePassword'])
            ->middleware('throttle:password')->name('me.password');
        Route::post('me/google', [MeController::class, 'linkGoogle'])->middleware('throttle:auth')->name('me.google');

        // Saved businesses, places, events and stories.
        Route::get('me/saved', [Account\SavedController::class, 'index'])->name('me.saved.index');
        Route::get('me/saved/keys', [Account\SavedController::class, 'keys'])->name('me.saved.keys');
        Route::put('me/saved/{type}/{id}', [Account\SavedController::class, 'store'])
            ->where(['type' => '[a-z_]+', 'id' => '[0-9A-Za-z]{26}'])->name('me.saved.store');
        Route::delete('me/saved/{type}/{id}', [Account\SavedController::class, 'destroy'])
            ->where(['type' => '[a-z_]+', 'id' => '[0-9A-Za-z]{26}'])->name('me.saved.destroy');

        // The member's reviews.
        Route::get('me/reviews', [Account\ReviewController::class, 'index'])->name('me.reviews.index');
        Route::patch('me/reviews/{review:id}', [Account\ReviewController::class, 'update'])->middleware('throttle:community')->name('me.reviews.update');
        Route::delete('me/reviews/{review:id}', [Account\ReviewController::class, 'destroy'])->name('me.reviews.destroy');
        Route::get('businesses/{business:slug}/my-review', [Account\ReviewController::class, 'mine'])->name('businesses.my-review');
        Route::post('businesses/{business:slug}/reviews', [Account\ReviewController::class, 'store'])
            ->middleware('throttle:community')->name('businesses.reviews.store');

        // Ownership claims and new listings.
        Route::post('businesses/{business:slug}/claim', [Account\ClaimController::class, 'store'])
            ->middleware('throttle:community')->name('businesses.claim');
        Route::get('me/claims', [Account\ClaimController::class, 'index'])->name('me.claims.index');
        Route::post('me/claims/{claim:id}/cancel', [Account\ClaimController::class, 'cancel'])->name('me.claims.cancel');
        Route::get('me/submissions', [Account\SubmissionController::class, 'index'])->name('me.submissions.index');
        Route::post('me/submissions/business', [Account\SubmissionController::class, 'storeBusiness'])
            ->middleware('throttle:community')->name('me.submissions.business');
        Route::delete('me/submissions/{submission:id}', [Account\SubmissionController::class, 'destroy'])->name('me.submissions.destroy');

        // Business owner tools (listings the member owns).
        Route::controller(Account\OwnerBusinessController::class)->prefix('me/businesses')->name('me.businesses.')->group(function () {
            Route::get('/', 'index')->name('index');
            Route::get('{business:id}', 'show')->name('show');
            Route::post('{business:id}/edits', 'proposeEdit')->middleware('throttle:community')->name('edits');
            Route::get('{business:id}/stats', 'stats')->name('stats');
            Route::get('{business:id}/reviews', 'reviews')->name('reviews');
            Route::put('{business:id}/reviews/{review:id}/reply', 'reply')->name('reviews.reply');
            Route::delete('{business:id}/reviews/{review:id}/reply', 'reply')->name('reviews.reply.destroy');
        });
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
    // Staff sign-in, separate from members.
    Route::prefix('admin/auth')->name('admin.auth.')->group(function () {
        Route::post('login', [Admin\AuthController::class, 'login'])->middleware('throttle:staff-auth')->name('login');
        Route::middleware(['auth:sanctum', 'staff'])->group(function () {
            Route::get('me', [Admin\AuthController::class, 'me'])->name('me');
            Route::post('logout', [Admin\AuthController::class, 'logout'])->name('logout');
            Route::put('password', [Admin\AuthController::class, 'password'])->middleware('throttle:password')->name('password');
        });
    });

    Route::prefix('admin')->name('admin.')->middleware(['auth:sanctum', 'staff', 'can:admin.access'])->group(function () {
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

        // DoonPortal team accounts and (read-only) member accounts.
        Route::middleware('can:'.PermissionName::ManageUsers->value)->group(function () {
            Route::controller(Admin\StaffController::class)->prefix('staff')->name('staff.')->group(function () {
                Route::get('/', 'index')->name('index');
                Route::post('/', 'store')->name('store');
                Route::get('{admin:id}', 'show')->name('show');
                Route::patch('{admin:id}', 'update')->name('update');
                Route::put('{admin:id}/roles', 'updateRoles')->name('roles');
                Route::put('{admin:id}/password', 'resetPassword')->name('password');
                Route::put('{admin:id}/active', 'setActive')->name('active');
            });
            Route::get('members', [Admin\MemberController::class, 'index'])->name('members.index');
            Route::get('members/{user:id}', [Admin\MemberController::class, 'show'])->name('members.show');
        });

        // AI data engine: settings, the daily discovery queue and its runs.
        Route::middleware('can:'.PermissionName::ManageAi->value)->prefix('ai')->name('ai.')->group(function () {
            Route::get('settings', [Admin\AiSettingsController::class, 'show'])->name('settings.show');
            Route::put('settings', [Admin\AiSettingsController::class, 'update'])->name('settings.update');
            Route::post('settings/test', [Admin\AiSettingsController::class, 'test'])->middleware('throttle:10,1')->name('settings.test');
            Route::controller(Admin\AiDiscoveryController::class)->group(function () {
                Route::get('discoveries', 'index')->name('discoveries.index');
                Route::post('discoveries/bulk', 'bulk')->name('discoveries.bulk');
                Route::patch('discoveries/{discovery:id}', 'update')->name('discoveries.update');
                Route::post('discoveries/{discovery:id}/approve', 'approve')->name('discoveries.approve');
                Route::post('discoveries/{discovery:id}/reject', 'reject')->name('discoveries.reject');
                Route::get('runs', 'runs')->name('runs.index');
                Route::get('runs/status', 'status')->name('runs.status');
                Route::post('runs', 'runNow')->name('runs.store');
            });
        });

        // Community moderation: ownership claims, submissions, reviews.
        Route::controller(Admin\ClaimController::class)->prefix('claims')->name('claims.')
            ->middleware('can:'.PermissionName::ManageClaims->value)->group(function () {
                Route::get('/', 'index')->name('index');
                Route::get('{claim:id}', 'show')->name('show');
                Route::post('{claim:id}/approve', 'approve')->name('approve');
                Route::post('{claim:id}/reject', 'reject')->name('reject');
            });
        Route::controller(Admin\SubmissionController::class)->prefix('submissions')->name('submissions.')
            ->middleware('can:'.PermissionName::ModerateSubmissions->value)->group(function () {
                Route::get('/', 'index')->name('index');
                Route::get('{submission:id}', 'show')->name('show');
                Route::post('{submission:id}/approve', 'approve')->name('approve');
                Route::post('{submission:id}/reject', 'reject')->name('reject');
            });
        Route::controller(Admin\ReviewController::class)->prefix('reviews')->name('reviews.')
            ->middleware('can:'.PermissionName::ModerateReviews->value)->group(function () {
                Route::get('/', 'index')->name('index');
                Route::post('{review:id}/status', 'status')->name('status');
                Route::delete('{review:id}/reply', 'removeReply')->name('reply.destroy');
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
