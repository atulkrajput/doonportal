<?php

namespace App\Http\Requests\Account;

use App\Http\Requests\Admin\BusinessRequest;
use App\Models\Business;
use App\Models\Media;
use App\Services\BusinessImages\BusinessImageStore;
use App\Services\Community\OwnerEditService;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * An owner's proposed changes to their listing. Same validation as the admin
 * form, limited to the fields owners may change: name, categories, areas,
 * visibility and verification stay with staff.
 */
class OwnerBusinessEditRequest extends BusinessRequest
{
    public function attributeKeys(): array
    {
        return array_values(array_intersect(parent::attributeKeys(), OwnerEditService::ATTRIBUTES));
    }

    public function rules(): array
    {
        $allowed = [...OwnerEditService::ATTRIBUTES, ...OwnerEditService::RELATIONS];

        return [
            ...Arr::where(parent::rules(), fn ($rules, string $key) => in_array(strtok($key, '.'), $allowed, true)),
            'photos' => ['sometimes', 'array', 'max:10'],
            'photos.*.media_id' => ['required', 'string', 'distinct', Rule::exists('media', 'id')],
            'photos.*.caption' => ['nullable', 'string', 'max:150'],
        ];
    }

    public function after(): array
    {
        return [...parent::after(), function (Validator $validator) {
            $business = $this->route('business');
            if (! $business instanceof Business) {
                return;
            }
            // New images must be ones the owner uploaded for this business; unchanged ones may stay.
            $current = app(OwnerEditService::class)->snapshot($business);
            $keep = array_filter([$current['logo_media_id'], $current['cover_media_id'], ...array_column($current['photos'], 'media_id')]);
            $ids = array_filter([
                'logo_media_id' => $this->input('logo_media_id'),
                'cover_media_id' => $this->input('cover_media_id'),
                ...collect((array) $this->input('photos', []))->mapWithKeys(fn ($p, $i) => ["photos.{$i}.media_id" => $p['media_id'] ?? null])->all(),
            ], fn ($id) => is_string($id) && $id !== '' && ! in_array($id, $keep, true));
            $media = Media::whereIn('id', array_values($ids))->get()->keyBy('id');
            foreach ($ids as $field => $id) {
                if (! $media->has($id) || ! BusinessImageStore::belongsTo($media[$id], $business)) {
                    $validator->errors()->add($field, 'Upload this image for your business first.');
                }
            }
        }];
    }

    /**
     * @return array<string, mixed>
     */
    public function proposal(): array
    {
        return Arr::only($this->validated(), [...OwnerEditService::ATTRIBUTES, ...OwnerEditService::RELATIONS]);
    }
}
