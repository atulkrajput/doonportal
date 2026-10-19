<?php

namespace Tests\Unit;

use App\AI\AIProvider;
use App\AI\AIProviderException;
use App\AI\Providers\FakeProvider;
use App\AI\Providers\GroqProvider;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GroqProviderTest extends TestCase
{
    private function provider(?string $key = 'test-key'): GroqProvider
    {
        return new GroqProvider([
            'api_key' => $key,
            'base_url' => 'https://api.groq.test/openai/v1',
            'model' => 'test-model',
            'timeout' => 5,
        ]);
    }

    public function test_it_returns_decoded_json_and_usage(): void
    {
        Http::fake([
            'api.groq.test/*' => Http::response([
                'model' => 'test-model',
                'choices' => [['message' => ['content' => '{"name":"Cafe"}']]],
                'usage' => ['prompt_tokens' => 10, 'completion_tokens' => 5],
            ]),
        ]);

        $response = $this->provider()->chatJson([['role' => 'user', 'content' => 'hi']]);

        $this->assertSame(['name' => 'Cafe'], $response->data);
        $this->assertSame(15, $response->totalTokens());
        Http::assertSent(fn (Request $r) => $r->hasHeader('Authorization', 'Bearer test-key')
            && $r['response_format'] === ['type' => 'json_object']
            && $r['model'] === 'test-model');
    }

    public function test_it_rejects_non_json_content(): void
    {
        Http::fake(['*' => Http::response(['choices' => [['message' => ['content' => 'not json']]]])]);

        $this->expectException(AIProviderException::class);
        $this->provider()->chatJson([['role' => 'user', 'content' => 'hi']]);
    }

    public function test_http_errors_do_not_leak_the_key(): void
    {
        Http::fake(['*' => Http::response(['error' => 'bad'], 500)]);

        try {
            $this->provider('secret-key-value')->chatJson([['role' => 'user', 'content' => 'hi']]);
            $this->fail('Expected exception');
        } catch (AIProviderException $e) {
            $this->assertStringNotContainsString('secret-key-value', $e->getMessage());
        }
    }

    public function test_missing_key_fails_fast_without_http_call(): void
    {
        Http::fake();

        try {
            $this->provider(null)->chatJson([['role' => 'user', 'content' => 'hi']]);
            $this->fail('Expected exception');
        } catch (AIProviderException) {
            Http::assertNothingSent();
        }
    }

    public function test_container_resolves_configured_provider(): void
    {
        config(['ai.default' => 'fake']);
        $this->app->forgetInstance(AIProvider::class);

        $this->assertInstanceOf(FakeProvider::class, $this->app->make(AIProvider::class));
    }
}
