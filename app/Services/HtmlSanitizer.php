<?php

namespace App\Services;

use Symfony\Component\HtmlSanitizer\HtmlSanitizer as SymfonySanitizer;
use Symfony\Component\HtmlSanitizer\HtmlSanitizerConfig;

/**
 * Server-side allowlist sanitizer for editorial rich text (story bodies).
 * Anything not listed here — scripts, styles, event handlers, iframes, forms,
 * javascript:/data: URLs — is removed before the HTML is stored.
 */
class HtmlSanitizer
{
    public const MAX_INPUT_LENGTH = 200_000;

    private const TEXT_ELEMENTS = [
        'p', 'br', 'hr', 'h2', 'h3', 'h4', 'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup', 'small',
        'blockquote', 'ul', 'ol', 'li', 'code', 'pre', 'figure', 'figcaption',
        'table', 'thead', 'tbody', 'tr', 'th', 'td', 'caption',
    ];

    private readonly SymfonySanitizer $sanitizer;

    public function __construct()
    {
        $config = (new HtmlSanitizerConfig)
            ->allowLinkSchemes(['https', 'http', 'mailto'])
            ->allowRelativeLinks()
            ->allowMediaSchemes(['https'])
            ->allowRelativeMedias()
            ->allowElement('a', ['href', 'title'])
            ->allowElement('img', ['src', 'alt', 'title', 'width', 'height'])
            ->forceAttribute('a', 'rel', 'noopener noreferrer nofollow')
            ->withMaxInputLength(self::MAX_INPUT_LENGTH);

        foreach (self::TEXT_ELEMENTS as $element) {
            $config = $config->allowElement($element);
        }

        $this->sanitizer = new SymfonySanitizer($config);
    }

    public function sanitize(?string $html): ?string
    {
        if ($html === null) {
            return null;
        }

        $clean = trim($this->sanitizer->sanitize($html));

        return $clean === '' ? null : $clean;
    }

    /**
     * Rough reading time at ~200 words per minute.
     */
    public static function readingMinutes(?string $html): ?int
    {
        $words = str_word_count(strip_tags((string) $html));

        return $words === 0 ? null : max(1, (int) ceil($words / 200));
    }
}
