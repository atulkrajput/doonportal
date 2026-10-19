<?php

namespace App\Providers;

use App\AI\AIProvider;
use App\AI\Providers\FakeProvider;
use App\AI\Providers\GroqProvider;
use App\Enums\EntityType;
use App\Enums\PermissionName;
use App\Models\User;
use App\Services\Search\DatabaseSearchService;
use App\Services\Search\SearchService;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use InvalidArgumentException;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(AIProvider::class, function ($app) {
            $name = config('ai.default');

            return match ($name) {
                'groq' => new GroqProvider(config('ai.providers.groq')),
                'fake' => new FakeProvider,
                default => throw new InvalidArgumentException("Unsupported AI provider [{$name}]."),
            };
        });

        $this->app->bind(SearchService::class, DatabaseSearchService::class);
    }

    public function boot(): void
    {
        // Catch N+1 queries and silently dropped mass-assignment in development.
        Model::preventLazyLoading(! $this->app->isProduction());
        Model::preventSilentlyDiscardingAttributes(! $this->app->isProduction());

        // Controlled polymorphic types: anything outside this map is rejected.
        Relation::enforceMorphMap(EntityType::morphMap());

        Gate::before(fn (User $user) => $user->isSuperAdmin() ? true : null);

        foreach (PermissionName::cases() as $permission) {
            Gate::define($permission->value, fn (User $user) => $user->hasPermission($permission));
        }

        // Staff area: any user holding at least one permission.
        Gate::define('admin.access', fn (User $user) => $user->permissionNames() !== []);

        Gate::define('media.upload', fn (User $user) => collect(PermissionName::contentManagement())
            ->contains(fn (PermissionName $p) => $user->hasPermission($p)));

        ResetPassword::createUrlUsing(fn (User $user, string $token) => url('/reset-password').'?'.http_build_query([
            'token' => $token,
            'email' => $user->getEmailForPasswordReset(),
        ]));

        $this->configureRateLimiting();
    }

    private function configureRateLimiting(): void
    {
        RateLimiter::for('api', fn (Request $request) => Limit::perMinute(120)->by($request->user()?->id ?: $request->ip()));

        RateLimiter::for('auth', fn (Request $request) => [
            Limit::perMinute(10)->by('ip:'.$request->ip()),
            Limit::perMinute(5)->by('email:'.strtolower((string) $request->input('email'))),
        ]);

        RateLimiter::for('analytics', fn (Request $request) => Limit::perMinute(60)->by($request->user()?->id ?: $request->ip()));
    }
}
