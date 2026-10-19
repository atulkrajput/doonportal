<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Auth\PasswordResetController;
use App\Http\Controllers\Api\V1\MeController;
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
});
