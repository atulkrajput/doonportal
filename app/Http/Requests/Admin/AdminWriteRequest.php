<?php

namespace App\Http\Requests\Admin;

use App\Enums\CategoryType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;
use Illuminate\Validation\Rules\Unique;

/**
 * Base for admin create/update requests. POST requires the core fields;
 * PATCH/PUT validate only what is sent. Authorization happens in route
 * middleware, so authorize() is not overridden here.
 */
abstract class AdminWriteRequest extends FormRequest
{
    /** Uttarakhand bounding box: coordinates outside it are almost certainly typos. */
    protected const LAT_RULE = 'between:28.5,31.5';

    protected const LNG_RULE = 'between:77.5,81.1';

    protected const PHONE_REGEX = 'regex:/^\+?[0-9][0-9 \-]{6,18}$/';

    /**
     * Columns this request may write to the model. Relation payloads (ids,
     * child rows) are handled separately by the controller.
     *
     * @return list<string>
     */
    abstract public function attributeKeys(): array;

    /**
     * @return array<string, mixed>
     */
    public function modelAttributes(): array
    {
        $attributes = Arr::only($this->validated(), $this->attributeKeys());

        // A blank slug means "keep / generate one", never "clear it".
        if (array_key_exists('slug', $attributes) && blank($attributes['slug'])) {
            unset($attributes['slug']);
        }

        return $attributes;
    }

    protected function creating(): bool
    {
        return $this->isMethod('POST');
    }

    /**
     * "required" when creating, "sometimes" (present → validated) when updating.
     */
    protected function requiredOnCreate(): string
    {
        return $this->creating() ? 'required' : 'sometimes';
    }

    /**
     * The model bound to the current route, if any (for unique-ignore rules).
     */
    protected function routeModel(string $parameter): ?Model
    {
        $value = $this->route($parameter);

        return $value instanceof Model ? $value : null;
    }

    protected function uniqueSlug(string $table, string $parameter): Unique
    {
        return Rule::unique($table, 'slug')->ignore($this->routeModel($parameter)?->getKey());
    }

    protected function categoryOfType(CategoryType $type): Exists
    {
        return Rule::exists('categories', 'id')->where('type', $type->value)->whereNull('deleted_at');
    }

    protected function existingArea(): Exists
    {
        return Rule::exists('areas', 'id')->whereNull('deleted_at');
    }

    /**
     * @return array<string, mixed>
     */
    protected function slugRules(string $table, string $parameter): array
    {
        return ['slug' => ['sometimes', 'nullable', 'string', 'max:180', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $this->uniqueSlug($table, $parameter)]];
    }

    /**
     * @return array<string, mixed>
     */
    protected function coordinateRules(): array
    {
        // No "sometimes": coordinates must always be sent as a pair.
        return [
            'latitude' => ['nullable', 'numeric', self::LAT_RULE, 'required_with:longitude'],
            'longitude' => ['nullable', 'numeric', self::LNG_RULE, 'required_with:latitude'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function sourceRules(): array
    {
        return [
            'source_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'source_url' => ['sometimes', 'nullable', 'url:http,https', 'max:2048'],
        ];
    }

    protected function mediaRule(): Exists
    {
        return Rule::exists('media', 'id');
    }
}
