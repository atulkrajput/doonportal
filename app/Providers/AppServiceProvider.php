<?php

namespace App\Providers;

use App\AI\AIProvider;
use App\AI\Providers\FakeProvider;
use App\AI\Providers\GroqProvider;
use App\AI\Providers\OpenAIProvider;
use App\Enums\EntityType;
use App\Enums\PermissionName;
use App\Models\Admin;
use App\Models\User;
use App\Services\AI\AiSettings;
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
        $this->app->singleton(AiSettings::class);

        // Provider, model and key come from Admin > AI settings (falling back to .env).
        $this->app->bind(AIProvider::class, function ($app) {
            if (config('ai.default') === 'fake') {
                return new FakeProvider;
            }
            $settings = $app->make(AiSettings::class);
            $name = $settings->get('provider');

            return match ($name) {
                'groq' => new GroqProvider($settings->providerConfig('groq')),
                'openai' => new OpenAIProvider($settings->providerConfig('openai')),
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

        // Permissions belong to staff accounts only; members never pass a staff gate.
        Gate::before(fn (User|Admin $user) => $user instanceof Admin && $user->isSuperAdmin() ? true : null);

        foreach (PermissionName::cases() as $permission) {
            Gate::define($permission->value, fn (User|Admin $user) => $user instanceof Admin && $user->hasPermission($permission));
        }

        // Staff area: any active staff account holding at least one permission.
        Gate::define('admin.access', fn (User|Admin $user) => $user instanceof Admin && $user->permissionNames() !== []);

        Gate::define('media.upload', fn (User|Admin $user) => $user instanceof Admin && collect(PermissionName::contentManagement())
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

        RateLimiter::for('staff-auth', fn (Request $request) => [
            Limit::perMinute(5)->by('staff-ip:'.$request->ip()),
            Limit::perMinute(5)->by('staff-email:'.strtolower((string) $request->input('email'))),
        ]);

        RateLimiter::for('auth', fn (Request $request) => [
            Limit::perMinute(10)->by('ip:'.$request->ip()),
            Limit::perMinute(5)->by('email:'.strtolower((string) $request->input('email'))),
        ]);

        // Limits guessing of the current password with a stolen token.
        RateLimiter::for('password', fn (Request $request) => Limit::perMinute(5)->by('password:'.($request->user()?->id ?: $request->ip())));

        // Reviews, claims, listing submissions and edits: plenty for real use, too slow for spam.
        RateLimiter::for('community', fn (Request $request) => [
            Limit::perMinute(6)->by('community:'.($request->user()?->id ?: $request->ip())),
            Limit::perDay(40)->by('community-day:'.($request->user()?->id ?: $request->ip())),
        ]);

        RateLimiter::for('analytics', fn (Request $request) => Limit::perMinute(60)->by($request->user()?->id ?: $request->ip()));
    }
}
