<?php

namespace App\Http\Requests\Admin;

use App\Services\MediaService;
use Illuminate\Foundation\Http\FormRequest;

class MediaUploadRequest extends FormRequest
{
    public function rules(): array
    {
        $max = MediaService::MAX_DIMENSION;

        return [
            // mimetypes checks the type detected from the file contents, not the client's name or header.
            'file' => ['required', 'file', 'mimetypes:'.implode(',', array_keys(MediaService::MIME_EXTENSIONS)),
                'max:'.MediaService::MAX_KILOBYTES, "dimensions:max_width={$max},max_height={$max}"],
            'alt_text' => ['nullable', 'string', 'max:255'],
            'credit' => ['nullable', 'string', 'max:255'],
            'source_url' => ['nullable', 'url:http,https', 'max:2048'],
        ];
    }
}
