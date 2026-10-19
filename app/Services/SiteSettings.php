<?php

namespace App\Services;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * Typed, validated site settings stored one row per group.
 *
 * Tracking settings are IDs only (validated by strict patterns) and are rendered
 * into fixed script templates server-side — staff can never inject raw markup.
 */
class SiteSettings
{
    public const GROUPS = ['seo', 'social', 'tracking', 'legal'];

    /**
     * @return array<string, mixed>
     */
    public static function defaults(string $group): array
    {
        return match ($group) {
            'seo' => [
                'site_name' => 'DoonPortal',
                'title_template' => '%s | DoonPortal',
                'home_title' => 'DoonPortal — All Things Doon',
                'home_description' => 'Discover. Connect. Belong. Businesses, places, events and stories from Dehradun.',
                'default_description' => 'Your guide to Dehradun: local businesses, places to visit, events and stories.',
                'default_image_media_id' => null,
                'allow_indexing' => true,
            ],
            'social' => [
                'facebook_url' => null,
                'instagram_url' => null,
                'x_url' => null,
                'youtube_url' => null,
                'linkedin_url' => null,
                'whatsapp_url' => null,
                'x_handle' => null,
            ],
            'tracking' => [
                'ga4_measurement_id' => null,
                'gtm_container_id' => null,
                'meta_pixel_id' => null,
                'clarity_project_id' => null,
                'google_site_verification' => null,
                'bing_site_verification' => null,
            ],
            // Operator and grievance details shown on legal pages. Never guessed: empty until staff fill them in.
            'legal' => [
                'operator_name' => null,
                'contact_email' => null,
                'contact_phone' => null,
                'postal_address' => null,
                'grievance_officer_name' => null,
                'grievance_officer_email' => null,
                'jurisdiction_city' => 'Dehradun',
            ],
            default => throw new InvalidArgumentException("Unknown settings group [{$group}]."),
        };
    }

    /** Legal details that must be filled in before the legal pages are complete. */
    public const REQUIRED_LEGAL = ['operator_name', 'contact_email', 'postal_address', 'grievance_officer_name', 'grievance_officer_email'];

    /**
     * Validation rules for a PUT of the whole group.
     *
     * @return array<string, mixed>
     */
    public static function rules(string $group): array
    {
        $profile = fn (string $hosts) => ['nullable', 'url:https', 'max:255', 'regex:#^https://(www\.)?('.$hosts.')/#i'];

        return match ($group) {
            'seo' => [
                'site_name' => ['required', 'string', 'max:60'],
                'title_template' => ['required', 'string', 'max:80', 'regex:/%s/'],
                'home_title' => ['required', 'string', 'max:70'],
                'home_description' => ['required', 'string', 'max:160'],
                'default_description' => ['required', 'string', 'max:160'],
                'default_image_media_id' => ['nullable', 'string', 'exists:media,id'],
                'allow_indexing' => ['required', 'boolean'],
            ],
            'social' => [
                'facebook_url' => $profile('facebook\.com'),
                'instagram_url' => $profile('instagram\.com'),
                'x_url' => $profile('x\.com|twitter\.com'),
                'youtube_url' => $profile('youtube\.com|youtu\.be'),
                'linkedin_url' => $profile('linkedin\.com'),
                'whatsapp_url' => $profile('wa\.me|whatsapp\.com|chat\.whatsapp\.com'),
                'x_handle' => ['nullable', 'string', 'regex:/^@?[A-Za-z0-9_]{1,15}$/'],
            ],
            'tracking' => [
                'ga4_measurement_id' => ['nullable', 'string', 'regex:/^G-[A-Z0-9]{4,15}$/'],
                'gtm_container_id' => ['nullable', 'string', 'regex:/^GTM-[A-Z0-9]{4,12}$/'],
                'meta_pixel_id' => ['nullable', 'string', 'regex:/^[0-9]{6,20}$/'],
                'clarity_project_id' => ['nullable', 'string', 'regex:/^[a-z0-9]{6,20}$/'],
                'google_site_verification' => ['nullable', 'string', 'regex:/^[A-Za-z0-9_-]{10,100}$/'],
                'bing_site_verification' => ['nullable', 'string', 'regex:/^[A-Fa-f0-9]{16,64}$/'],
            ],
            'legal' => [
                'operator_name' => ['nullable', 'string', 'max:150'],
                'contact_email' => ['nullable', 'email', 'max:255'],
                'contact_phone' => ['nullable', 'string', 'regex:/^\+?[0-9][0-9 \-]{6,18}$/'],
                'postal_address' => ['nullable', 'string', 'max:500'],
                'grievance_officer_name' => ['nullable', 'string', 'max:150'],
                'grievance_officer_email' => ['nullable', 'email', 'max:255'],
                'jurisdiction_city' => ['required', 'string', 'max:80'],
            ],
            default => throw new InvalidArgumentException("Unknown settings group [{$group}]."),
        };
    }

    /**
     * @return array<string, string>
     */
    public static function messages(): array
    {
        return [
            'title_template.regex' => 'The title template must contain %s where the page title goes.',
            'ga4_measurement_id.regex' => 'Enter only the measurement ID, like G-ABC123XYZ.',
            'gtm_container_id.regex' => 'Enter only the container ID, like GTM-AB12CD3.',
            'meta_pixel_id.regex' => 'Enter only the numeric Pixel ID.',
            'clarity_project_id.regex' => 'Enter only the Clarity project ID (lowercase letters and digits).',
            'google_site_verification.regex' => 'Paste only the content value of the Google verification tag.',
            'bing_site_verification.regex' => 'Paste only the content value of the Bing verification tag.',
            '*.regex' => 'This must be a link to your profile on that site, starting with https://.',
            'x_handle.regex' => 'Enter a handle like @doonportal.',
            'contact_phone.regex' => 'Enter a phone number with digits, spaces or dashes, optionally starting with +.',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function get(string $group): array
    {
        $defaults = self::defaults($group);

        $stored = Cache::rememberForever($this->cacheKey($group),
            fn () => Setting::where('group', $group)->value('value') ?? []);

        return array_merge($defaults, Arr::only((array) $stored, array_keys($defaults)));
    }

    /**
     * @param  array<string, mixed>  $values  already validated against rules()
     * @return array<string, mixed>
     */
    public function update(string $group, array $values, ?User $actor = null): array
    {
        $old = $this->get($group);
        $new = array_merge($old, Arr::only($values, array_keys(self::defaults($group))));
        $new = array_map(fn ($v) => $v === '' ? null : $v, $new);
        if ($group === 'social' && filled($new['x_handle'])) {
            $new['x_handle'] = '@'.ltrim($new['x_handle'], '@');
        }

        $changedKeys = array_keys(array_filter($new, fn ($v, $k) => ($old[$k] ?? null) !== $v, ARRAY_FILTER_USE_BOTH));

        if ($changedKeys !== []) {
            DB::transaction(function () use ($group, $new, $old, $changedKeys, $actor) {
                $setting = Setting::updateOrCreate(['group' => $group], ['value' => $new, 'updated_by' => $actor?->id]);
                app(AuditLogger::class)->log("settings.{$group}_updated", $setting,
                    Arr::only($old, $changedKeys), Arr::only($new, $changedKeys), $actor);
            });
            Cache::forget($this->cacheKey($group));
        }

        return $this->get($group);
    }

    private function cacheKey(string $group): string
    {
        return "site-settings.{$group}";
    }
}
