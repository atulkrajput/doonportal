<?php

namespace App\Services\AI;

use App\Models\Admin;
use App\Models\Setting;
use App\Services\AuditLogger;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

/**
 * AI provider and discovery settings (Admin > AI settings), stored in the
 * settings table as group "ai". API keys are encrypted with the app key and
 * never sent back to the browser; .env values (GROQ_API_KEY, OPENAI_API_KEY,
 * TAVILY_API_KEY) are used when no key is saved here.
 */
class AiSettings
{
    public const PROVIDERS = ['groq', 'openai'];

    public const SECRETS = ['groq_api_key', 'openai_api_key', 'tavily_api_key'];

    private const ENV_KEYS = [
        'groq_api_key' => 'ai.providers.groq.api_key',
        'openai_api_key' => 'ai.providers.openai.api_key',
        'tavily_api_key' => 'ai.tavily_api_key',
    ];

    /** @var array<string, mixed>|null */
    private ?array $cache = null;

    /**
     * @return array<string, mixed>
     */
    public static function defaults(): array
    {
        return [
            'provider' => config('ai.default') === 'openai' ? 'openai' : 'groq',
            'groq_model' => config('ai.providers.groq.model'),
            'openai_model' => config('ai.providers.openai.model'),
            'discovery_enabled' => false,
            'per_category_limit' => 5,
            'use_web_search' => true,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function rules(): array
    {
        return [
            'provider' => ['required', 'in:'.implode(',', self::PROVIDERS)],
            'groq_model' => ['required', 'string', 'max:100', 'regex:/^[A-Za-z0-9._:\/-]+$/'],
            'openai_model' => ['required', 'string', 'max:100', 'regex:/^[A-Za-z0-9._:\/-]+$/'],
            'discovery_enabled' => ['required', 'boolean'],
            'per_category_limit' => ['required', 'integer', 'between:1,'.config('discovery.max_per_category')],
            'use_web_search' => ['required', 'boolean'],
            // Blank = keep the saved key; send clear_<key> to remove it.
            'groq_api_key' => ['nullable', 'string', 'max:300'],
            'openai_api_key' => ['nullable', 'string', 'max:300'],
            'tavily_api_key' => ['nullable', 'string', 'max:300'],
            'clear' => ['sometimes', 'array'],
            'clear.*' => ['in:'.implode(',', self::SECRETS)],
        ];
    }

    /**
     * Settings with decrypted keys. Server-side use only.
     *
     * @return array<string, mixed>
     */
    public function all(): array
    {
        if ($this->cache !== null) {
            return $this->cache;
        }

        $stored = Setting::where('group', 'ai')->value('value') ?? [];
        $values = array_merge(self::defaults(), array_intersect_key($stored, self::defaults()));

        foreach (self::SECRETS as $key) {
            $values[$key] = $this->decrypt($stored[$key] ?? null) ?? (config(self::ENV_KEYS[$key]) ?: null);
            $values["{$key}_source"] = filled($stored[$key] ?? null) ? 'admin' : (filled(config(self::ENV_KEYS[$key])) ? 'env' : null);
        }

        return $this->cache = $values;
    }

    public function get(string $key): mixed
    {
        return $this->all()[$key] ?? null;
    }

    /**
     * What the admin screen may see: keys only as "set / last 4 characters".
     *
     * @return array<string, mixed>
     */
    public function forAdmin(): array
    {
        $all = $this->all();
        $public = array_intersect_key($all, self::defaults());

        foreach (self::SECRETS as $key) {
            $public['keys'][$key] = [
                'set' => filled($all[$key]),
                'hint' => filled($all[$key]) ? '…'.substr((string) $all[$key], -4) : null,
                'source' => $all["{$key}_source"],
            ];
        }

        return $public;
    }

    /**
     * Provider config for App\AI (key + model from these settings).
     *
     * @return array{api_key: ?string, base_url: string, model: string, timeout: int}
     */
    public function providerConfig(string $provider): array
    {
        return [
            ...config("ai.providers.{$provider}"),
            'api_key' => $this->get("{$provider}_api_key"),
            'model' => $this->get("{$provider}_model") ?: config("ai.providers.{$provider}.model"),
        ];
    }

    public function aiConfigured(): bool
    {
        return filled($this->get($this->get('provider').'_api_key'));
    }

    /**
     * @param  array<string, mixed>  $values  validated against rules()
     */
    public function update(array $values, ?Admin $actor = null): void
    {
        $row = Setting::firstOrNew(['group' => 'ai']);
        $stored = $row->value ?? [];
        $old = $this->forAdmin();

        foreach (array_keys(self::defaults()) as $key) {
            if (array_key_exists($key, $values)) {
                $stored[$key] = $values[$key];
            }
        }
        foreach (self::SECRETS as $key) {
            if (in_array($key, $values['clear'] ?? [], true)) {
                unset($stored[$key]);
            } elseif (filled($values[$key] ?? null)) {
                $stored[$key] = Crypt::encryptString(trim($values[$key]));
            }
        }

        DB::transaction(function () use ($row, $stored, $actor, $old) {
            $row->fill(['value' => $stored, 'updated_by' => $actor?->id])->save();
            $this->cache = null;
            $new = $this->forAdmin();
            // The audit trail records which keys changed, never their values.
            app(AuditLogger::class)->log('settings.ai_updated', $row, $this->auditable($old), $this->auditable($new), $actor);
        });

        $this->cache = null;
    }

    /**
     * @param  array<string, mixed>  $values
     * @return array<string, mixed>
     */
    private function auditable(array $values): array
    {
        $keys = $values['keys'];
        unset($values['keys']);
        foreach ($keys as $name => $state) {
            $values[$name] = $state['set'] ? 'set ('.$state['hint'].')' : 'not set';
        }

        return $values;
    }

    private function decrypt(?string $value): ?string
    {
        if (blank($value)) {
            return null;
        }

        try {
            return Crypt::decryptString($value);
        } catch (DecryptException) {
            return null; // APP_KEY changed: the key has to be entered again.
        }
    }
}
