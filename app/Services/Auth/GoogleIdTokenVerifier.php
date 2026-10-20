<?php

namespace App\Services\Auth;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Verifies a Google Identity Services ID token (the "credential" the Sign in
 * with Google button hands the browser). Google's tokeninfo endpoint checks the
 * signature and expiry; we check it was issued for this site's client ID by
 * Google, and that Google has verified the email address.
 */
class GoogleIdTokenVerifier
{
    private const TOKENINFO_URL = 'https://oauth2.googleapis.com/tokeninfo';

    private const ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];

    public function enabled(): bool
    {
        return filled(config('services.google.client_id'));
    }

    /**
     * @return array{sub: string, email: string, name: string, picture: ?string}
     *
     * @throws InvalidGoogleToken
     */
    public function verify(string $idToken): array
    {
        if (! $this->enabled()) {
            throw new RuntimeException('Google sign-in is not configured.');
        }

        try {
            $response = Http::timeout(10)->acceptJson()->get(self::TOKENINFO_URL, ['id_token' => $idToken]);
        } catch (ConnectionException) {
            throw new InvalidGoogleToken('We could not reach Google. Please try again.');
        }

        $claims = $response->successful() ? $response->json() : null;

        if (! is_array($claims)
            || ($claims['aud'] ?? null) !== config('services.google.client_id')
            || ! in_array($claims['iss'] ?? null, self::ISSUERS, true)
            || (int) ($claims['exp'] ?? 0) < now()->getTimestamp()
            || blank($claims['sub'] ?? null)
            || blank($claims['email'] ?? null)) {
            throw new InvalidGoogleToken('Google sign-in failed. Please try again.');
        }

        // tokeninfo returns booleans as strings.
        if (! filter_var($claims['email_verified'] ?? false, FILTER_VALIDATE_BOOL)) {
            throw new InvalidGoogleToken('Your Google account’s email address is not verified.');
        }

        return [
            'sub' => (string) $claims['sub'],
            'email' => strtolower((string) $claims['email']),
            'name' => trim((string) ($claims['name'] ?? '')) ?: strstr((string) $claims['email'], '@', true),
            'picture' => $claims['picture'] ?? null,
        ];
    }
}
