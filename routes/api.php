<?php

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
use App\Http\Controllers\Api\V1\PlaceController;
use App\Http\Controllers\Api\V1\SearchController;
use App\Http\Controllers\Api\V1\StoryController;
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
    });

    // Public discovery
    Route::get('home', HomeController::class)->name('home');
    Route::get('search', SearchController::class)->name('search');

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
});
