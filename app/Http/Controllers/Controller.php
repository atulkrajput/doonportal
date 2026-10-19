<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Gate;

abstract class Controller
{
    /**
     * The token-authenticated user on public routes that do not require auth.
     */
    protected function viewer(): ?User
    {
        return auth('sanctum')->user();
    }

    /**
     * Respond 404 (not 403) for records the viewer may not see, so hidden
     * listings are indistinguishable from missing ones.
     */
    protected function ensureVisible(Model $model): void
    {
        abort_unless(Gate::forUser($this->viewer())->allows('view', $model), 404);
    }
}
