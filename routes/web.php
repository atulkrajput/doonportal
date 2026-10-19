<?php

use Illuminate\Support\Facades\Route;

// The React SPA handles every non-API path. API, health and storage paths are excluded.
Route::view('/{path?}', 'app')
    ->where('path', '^(?!api/|api$|up$|storage/|sanctum/).*$')
    ->name('spa');
