<?php

namespace App\Services;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

/**
 * Audited, transactional model writes shared by the admin API and the
 * moderation flows that apply user-proposed changes.
 */
class AuditedWriter
{
    public function __construct(private readonly AuditLogger $audit) {}

    /**
     * Fill, save and audit a model in one transaction. Only changed fields are
     * written to the audit trail; relation syncs report their own before/after.
     *
     * @param  array<string, mixed>  $attributes
     * @param  array<string, callable(Model): array{0: mixed, 1: mixed}>  $relations  name => sync callback returning [before, after]
     */
    public function save(Model $model, array $attributes, array $relations = [], ?string $action = null): Model
    {
        $creating = ! $model->exists;
        $type = $model->getMorphClass();

        return DB::transaction(function () use ($model, $attributes, $relations, $creating, $type, $action) {
            $model->fill($attributes);
            $dirty = array_keys($model->getDirty());
            $old = $creating ? [] : Arr::only($model->getOriginal(), $dirty);
            $new = collect($dirty)->mapWithKeys(fn (string $key) => [$key => $model->getAttribute($key)])->all();

            $model->save();

            foreach ($relations as $name => $sync) {
                [$before, $after] = $sync($model);
                if ($before != $after) {
                    $old[$name] = $before;
                    $new[$name] = $after;
                }
            }

            if ($creating || $new !== []) {
                $this->audit->log($action ?? $type.($creating ? '.created' : '.updated'), $model, $creating ? null : $old, $new);
            }

            return $model;
        });
    }

    /**
     * Sync a many-to-many relation to the given ids and report [before, after].
     *
     * @param  array<int|string, mixed>  $ids  plain ids, or id => pivot attributes
     * @return array{0: list<string>, 1: list<string>}
     */
    public function syncIds(BelongsToMany $relation, array $ids): array
    {
        $key = $relation->getRelated()->getQualifiedKeyName();
        $before = $relation->pluck($key)->sort()->values()->all();
        $relation->sync($ids);
        $after = $relation->pluck($key)->sort()->values()->all();

        return [$before, $after];
    }

    /**
     * Replace all child rows of a has-many relation and report [before, after].
     *
     * @param  list<array<string, mixed>>  $rows
     * @param  list<string>  $fields  fields compared and reported in the audit trail
     * @return array{0: list<array<string, mixed>>, 1: list<array<string, mixed>>}
     */
    public function replaceChildren(HasMany $relation, array $rows, array $fields): array
    {
        $snapshot = fn () => $relation->getQuery()->clone()->get()
            ->map(fn (Model $m) => Arr::only($m->toArray(), $fields))->values()->all();

        $before = $snapshot();
        $relation->getQuery()->clone()->delete();
        foreach ($rows as $row) {
            $relation->create(Arr::only($row, $fields));
        }

        return [$before, $snapshot()];
    }
}
