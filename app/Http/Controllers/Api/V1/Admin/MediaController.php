<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Requests\Admin\AdminIndexRequest;
use App\Http\Requests\Admin\MediaUpdateRequest;
use App\Http\Requests\Admin\MediaUploadRequest;
use App\Http\Resources\Admin\MediaResource;
use App\Models\Media;
use App\Services\MediaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class MediaController extends AdminController
{
    public function index(AdminIndexRequest $request): AnonymousResourceCollection
    {
        $query = Media::query();

        return MediaResource::collection($this->paginate($query, $request, ['alt_text', 'credit', 'path']));
    }

    public function store(MediaUploadRequest $request, MediaService $media): JsonResponse
    {
        $stored = $media->store($request->file('file'), $request->user(),
            Arr::only($request->validated(), ['alt_text', 'credit', 'source_url']));

        return (new MediaResource($stored))->response()->setStatusCode(201);
    }

    public function update(MediaUpdateRequest $request, Media $media): MediaResource
    {
        DB::transaction(function () use ($request, $media) {
            $media->fill($request->validated());
            $dirty = array_keys($media->getDirty());
            if ($dirty === []) {
                return;
            }
            $old = Arr::only($media->getOriginal(), $dirty);
            $media->save();
            $this->audit->log('media.updated', $media, $old, Arr::only($media->getAttributes(), $dirty));
        });

        return new MediaResource($media);
    }
}
