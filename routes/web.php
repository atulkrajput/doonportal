<?php

use App\Http\Controllers\SeoFilesController;
use App\Http\Controllers\SpaController;
use Illuminate\Support\Facades\Route;

Route::get('robots.txt', [SeoFilesController::class, 'robots'])->name('robots');
Route::get('sitemap.xml', [SeoFilesController::class, 'sitemap'])->name('sitemap');

// The React SPA handles every other non-API path. The shell is rendered with
// server-side SEO metadata and the right HTTP status (see SpaController).
Route::get('/{path?}', SpaController::class)
    ->where('path', '^(?!api/|api$|up$|storage/|sanctum/).*$')
    ->name('spa');
