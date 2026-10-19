<?php

namespace Tests\Unit;

use App\Services\HtmlSanitizer;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class HtmlSanitizerTest extends TestCase
{
    public static function attacks(): array
    {
        return [
            'script tag' => ['<p>a</p><script>alert(1)</script>', '<script'],
            'event handler' => ['<p onmouseover="alert(1)">a</p>', 'onmouseover'],
            'javascript url' => ['<a href="javascript:alert(1)">x</a>', 'javascript:'],
            'encoded javascript url' => ['<a href="jav&#x09;ascript:alert(1)">x</a>', 'ascript:'],
            'data url image' => ['<img src="data:image/svg+xml;base64,PHN2Zz4=">', 'data:'],
            'iframe' => ['<iframe src="https://evil.test"></iframe>', '<iframe'],
            'style attribute' => ['<p style="background:url(x)">a</p>', 'style'],
            'form' => ['<form action="https://evil.test"><input name="p"></form>', '<form'],
            'svg' => ['<svg><script>alert(1)</script></svg>', '<svg'],
            'object' => ['<object data="x.swf"></object>', '<object'],
        ];
    }

    #[DataProvider('attacks')]
    public function test_dangerous_markup_is_removed(string $html, string $forbidden): void
    {
        $this->assertStringNotContainsStringIgnoringCase($forbidden, (string) (new HtmlSanitizer)->sanitize($html));
    }

    public function test_editorial_markup_is_kept(): void
    {
        $html = '<h2>Title</h2><p>Some <strong>bold</strong> and <em>italic</em>. <a href="/place/robbers-cave">Internal</a></p>'
            .'<ul><li>One</li></ul><blockquote>Quote</blockquote><img src="https://cdn.example.test/a.jpg" alt="A">';
        $clean = (new HtmlSanitizer)->sanitize($html);

        foreach (['<h2>Title</h2>', '<strong>bold</strong>', '<em>italic</em>', 'href="/place/robbers-cave"', '<li>One</li>', '<blockquote>', 'alt="A"'] as $kept) {
            $this->assertStringContainsString($kept, $clean);
        }
        $this->assertStringContainsString('rel="noopener noreferrer nofollow"', $clean);
    }

    public function test_empty_results_become_null_and_reading_time_is_estimated(): void
    {
        $this->assertNull((new HtmlSanitizer)->sanitize('<script>x</script>'));
        $this->assertNull((new HtmlSanitizer)->sanitize(null));
        $this->assertNull(HtmlSanitizer::readingMinutes(''));
        $this->assertSame(2, HtmlSanitizer::readingMinutes('<p>'.str_repeat('word ', 300).'</p>'));
    }
}
