<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('user_id')->constrained()->cascadeOnDelete();
            $table->ulidMorphs('reviewable');
            $table->unsignedTinyInteger('rating');
            $table->string('title')->nullable();
            $table->text('body')->nullable();
            $table->string('status', 20)->default('PENDING');
            $table->date('visited_on')->nullable();
            $table->unsignedInteger('helpful_count')->default(0);
            $table->foreignUlid('moderated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('moderated_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // One review per user per entity.
            $table->unique(['user_id', 'reviewable_type', 'reviewable_id']);
            $table->index(['reviewable_type', 'reviewable_id', 'status']);
        });

        if (DB::getDriverName() !== 'sqlite') {
            DB::statement('ALTER TABLE reviews ADD CONSTRAINT reviews_rating_range CHECK (rating BETWEEN 1 AND 5)');
        }

        Schema::create('review_votes', function (Blueprint $table) {
            $table->foreignUlid('review_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('user_id')->constrained()->cascadeOnDelete();
            $table->boolean('is_helpful')->default(true);
            $table->timestamps();
            $table->primary(['review_id', 'user_id']);
        });

        Schema::create('favorites', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('user_id')->constrained()->cascadeOnDelete();
            $table->ulidMorphs('favoritable');
            $table->timestamps();

            $table->unique(['user_id', 'favoritable_type', 'favoritable_id']);
        });

        Schema::create('submissions', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('type', 20);
            $table->string('status', 20)->default('PENDING');
            $table->nullableUlidMorphs('entity'); // target entity for corrections/photos, or the created entity
            $table->json('payload');
            $table->foreignUlid('reviewer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_notes')->nullable();
            $table->timestamps();

            $table->index(['status', 'type', 'created_at']);
            $table->index(['user_id', 'created_at']);
        });

        Schema::create('reports', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('user_id')->nullable()->constrained()->nullOnDelete();
            $table->ulidMorphs('reportable');
            $table->string('reason', 30);
            $table->text('details')->nullable();
            $table->string('status', 20)->default('OPEN');
            $table->foreignUlid('resolver_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('resolved_at')->nullable();
            $table->text('resolution_notes')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at']);
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 100);
            $table->nullableUlidMorphs('auditable');
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['action', 'created_at']);
            $table->index(['actor_id', 'created_at']);
        });

        Schema::create('analytics_events', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('name', 50);
            $table->nullableUlidMorphs('entity');
            $table->foreignUlid('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('session_hash', 64)->nullable(); // salted hash, never raw IP
            $table->json('properties')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['name', 'created_at']);
            $table->index(['entity_type', 'entity_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('analytics_events');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('reports');
        Schema::dropIfExists('submissions');
        Schema::dropIfExists('favorites');
        Schema::dropIfExists('review_votes');
        Schema::dropIfExists('reviews');
    }
};
