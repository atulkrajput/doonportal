<?php

namespace App\Http\Resources;

use App\Models\Media;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Media
 */
class MediaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'url' => $this->url(),
            'alt' => $this->alt_text,
            'credit' => $this->credit,
            'width' => $this->width,
            'height' => $this->height,
        ];
    }
}
