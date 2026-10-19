<?php

namespace App\Services;

use App\Models\Page;

/**
 * Fills {{tokens}} in a stored (already sanitized) page body with values from
 * site settings. Every value is HTML-escaped. A token without a value renders
 * as a visible "to be published" marker — never an invented detail.
 */
class PageRenderer
{
    public const TOKENS = [
        'site_name', 'operator_name', 'contact_email', 'contact_phone', 'postal_address',
        'grievance_officer_name', 'grievance_officer_email', 'jurisdiction_city', 'optional_tools', 'last_updated',
    ];

    /** Third-party tools by tracking setting: [name, purpose, consent category]. */
    public const TRACKING_TOOLS = [
        'ga4_measurement_id' => ['Google Analytics 4', 'Measures how the site is used (pages viewed, approximate location, device type).', 'analytics'],
        'gtm_container_id' => ['Google Tag Manager', 'Loads measurement tags configured by DoonPortal.', 'analytics'],
        'clarity_project_id' => ['Microsoft Clarity', 'Heatmaps and session replays to improve usability (form inputs are masked).', 'analytics'],
        'meta_pixel_id' => ['Meta Pixel', 'Measures the effect of DoonPortal adverts on Facebook and Instagram.', 'marketing'],
    ];

    public function __construct(private readonly SiteSettings $settings) {}

    public function render(Page $page): string
    {
        $values = $this->values($page);

        return preg_replace_callback('/\{\{\s*([a-z_]+)\s*\}\}/', function (array $m) use ($values) {
            if (! in_array($m[1], self::TOKENS, true)) {
                return $m[0];
            }

            return $values[$m[1]] ?? '<em class="text-stone-500">(to be published)</em>';
        }, (string) $page->body);
    }

    /**
     * @return array<string, string|null> HTML-safe values
     */
    private function values(Page $page): array
    {
        $legal = $this->settings->get('legal');
        $seo = $this->settings->get('seo');
        $mail = fn (?string $email) => $email ? '<a href="mailto:'.e($email).'">'.e($email).'</a>' : null;
        $text = fn (?string $value) => filled($value) ? e($value) : null;

        return [
            'site_name' => e($seo['site_name']),
            'operator_name' => $text($legal['operator_name']),
            'contact_email' => $mail($legal['contact_email']),
            'contact_phone' => $text($legal['contact_phone']),
            'postal_address' => filled($legal['postal_address']) ? nl2br(e($legal['postal_address'])) : null,
            'grievance_officer_name' => $text($legal['grievance_officer_name']),
            'grievance_officer_email' => $mail($legal['grievance_officer_email']),
            'jurisdiction_city' => $text($legal['jurisdiction_city']),
            'optional_tools' => $this->toolsList(),
            'last_updated' => e(($page->updated_at ?? now())->setTimezone('Asia/Kolkata')->format('j F Y')),
        ];
    }

    private function toolsList(): string
    {
        $tracking = $this->settings->get('tracking');
        $items = [];
        foreach (self::TRACKING_TOOLS as $key => [$name, $purpose, $category]) {
            if (filled($tracking[$key])) {
                $items[] = '<li><strong>'.e($name).'</strong> ('.e($category).'): '.e($purpose).'</li>';
            }
        }

        return $items === []
            ? '<p>We do not currently use any third-party analytics or advertising tools.</p>'
            : '<ul>'.implode('', $items).'</ul>';
    }

    /**
     * Configured third-party tools grouped by consent category, for the cookie banner.
     *
     * @return array<string, list<array{key: string, name: string, purpose: string}>>
     */
    public function consentTools(): array
    {
        $tracking = $this->settings->get('tracking');
        $out = ['analytics' => [], 'marketing' => []];
        foreach (self::TRACKING_TOOLS as $key => [$name, $purpose, $category]) {
            if (filled($tracking[$key])) {
                $out[$category][] = ['key' => $key, 'name' => $name, 'purpose' => $purpose];
            }
        }

        return $out;
    }
}
