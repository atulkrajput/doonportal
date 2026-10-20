<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AdminIndexRequest;
use App\Services\AuditedWriter;
use App\Services\AuditLogger;
use App\Services\Discovery\DiscoveryQuery;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

/**
 * Shared plumbing for /api/v1/admin controllers: filtered listings and
 * audited, transactional writes. Authorization is enforced by route middleware
 * (`can:<permission>`), so every action here already runs as permitted staff.
 */
abstract class AdminController extends Controller
{
    public function __construct(protected readonly AuditLogger $audit) {}

    /**
     * @param  list<string>  $searchColumns
     * @param  array<string, string>  $sorts  allowlisted sort key => column
     */
    protected function paginate(Builder $query, AdminIndexRequest $request, array $searchColumns, array $sorts = []): LengthAwarePaginator
    {
        $filters = $request->validated();

        app(DiscoveryQuery::class)->applyText($query, $filters['q'] ?? null, $searchColumns);

        if (method_exists($query->getModel(), 'trashed')) {
            if (($filters['trashed'] ?? null) === 'only') {
                $query->onlyTrashed();
            } elseif (($filters['trashed'] ?? null) === 'with') {
                $query->withTrashed();
            }
        }

        $sorts += ['newest' => '-created_at', 'oldest' => 'created_at', 'updated' => '-updated_at'];
        $sort = $sorts[$filters['sort'] ?? 'newest'] ?? $sorts['newest'];
        $query->orderBy(ltrim($sort, '-'), str_starts_with($sort, '-') ? 'desc' : 'asc')
            ->orderBy($query->getModel()->getQualifiedKeyName(), 'desc');

        return $query->paginate($request->perPage())->withQueryString();
    }

    /**
     * Fill, save and audit a model in one transaction (see AuditedWriter::save()).
     *
     * @param  array<string, mixed>  $attributes
     * @param  array<string, callable(Model): array{0: mixed, 1: mixed}>  $relations
     */
    protected function saveAudited(Model $model, array $attributes, array $relations = []): Model
    {
        return app(AuditedWriter::class)->save($model, $attributes, $relations);
    }

    protected function deleteAudited(Model $model): void
    {
        DB::transaction(function () use ($model) {
            $model->delete();
            $this->audit->log($model->getMorphClass().'.deleted', $model);
        });
    }

    protected function restoreAudited(Model $model): void
    {
        DB::transaction(function () use ($model) {
            $model->restore();
            $this->audit->log($model->getMorphClass().'.restored', $model);
        });
    }

    /**
     * @param  array<int|string, mixed>  $ids
     * @return array{0: list<string>, 1: list<string>}
     */
    protected function syncIds(BelongsToMany $relation, array $ids): array
    {
        return app(AuditedWriter::class)->syncIds($relation, $ids);
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     * @param  list<string>  $fields
     * @return array{0: list<array<string, mixed>>, 1: list<array<string, mixed>>}
     */
    protected function replaceChildren(HasMany $relation, array $rows, array $fields): array
    {
        return app(AuditedWriter::class)->replaceChildren($relation, $rows, $fields);
    }
}
