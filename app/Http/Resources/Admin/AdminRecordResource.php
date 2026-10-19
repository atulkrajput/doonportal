<?php

namespace App\Http\Resources\Admin;

use App\Models\Media;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Staff view of a content record: every column plus loaded relations. Only for
 * /api/v1/admin routes behind permission gates — never for public endpoints.
 * Related users are reduced to id + name.
 *
 * @property Model $resource
 */
class AdminRecordResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $model = $this->resource;
        $data = $model->attributesToArray();

        foreach ($model->getRelations() as $name => $related) {
            $data[str($name)->snake()->toString()] = $this->present($related);
        }

        $data['type'] = $model->getMorphClass();
        if (method_exists($model, 'isDemo')) {
            $data['is_demo'] = $model->isDemo();
        }
        if (method_exists($model, 'trashed')) {
            $data['is_trashed'] = $model->trashed();
        }

        return $data;
    }

    private function present(mixed $related): mixed
    {
        return match (true) {
            $related === null => null,
            $related instanceof User => ['id' => $related->id, 'name' => $related->name],
            $related instanceof Media => MediaResource::make($related)->resolve(),
            $related instanceof Model => $related->toArray(),
            default => collect($related)->map(fn ($item) => $this->present($item))->values()->all(),
        };
    }
}
