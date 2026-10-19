<?php

namespace Tests\Feature;

use Tests\TestCase;

class SpaRoutingTest extends TestCase
{
    public function test_frontend_paths_serve_the_spa_shell(): void
    {
        $this->withoutVite();

        foreach (['/', '/business/some-cafe', '/events?when=weekend', '/area/rajpur-road'] as $path) {
            $this->get($path)->assertOk()->assertSee('<div id="app"></div>', false);
        }
    }

    public function test_unknown_api_paths_return_json_not_the_spa(): void
    {
        $this->get('/api/v1/nope')->assertNotFound()->assertHeader('content-type', 'application/json');
        $this->get('/api')->assertNotFound();
        $this->get('/up')->assertOk();
    }
}
