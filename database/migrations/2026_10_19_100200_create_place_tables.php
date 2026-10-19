<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('places', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('summary', 500)->nullable();
            $table->text('description')->nullable();
            $table->string('status', 20)->default('DRAFT');
            $table->boolean('is_featured')->default(false);

            $table->string('address_line')->nullable();
            $table->foreignUlid('primary_area_id')->nullable()->constrained('areas')->nullOnDelete();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();

            $table->string('timings')->nullable();
            $table->boolean('is_free')->nullable();
            $table->unsignedInteger('entry_fee_min_paise')->nullable();
            $table->unsignedInteger('entry_fee_max_paise')->nullable();
            $table->string('entry_fee_notes')->nullable();
            $table->text('accessibility_notes')->nullable();
            $table->boolean('has_parking')->nullable();
            $table->string('best_time_to_visit')->nullable();

            $table->decimal('rating_avg', 3, 2)->default(0);
            $table->unsignedInteger('rating_count')->default(0);
            $table->unsignedInteger('popularity_score')->default(0);
            $table->foreignUlid('cover_media_id')->nullable()->constrained('media')->nullOnDelete();

            $table->timestamp('published_at')->nullable();
            $table->timestamp('last_verified_at')->nullable();
            $table->string('source_name')->nullable();
            $table->string('source_url', 2048)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'published_at']);
        });

        Schema::create('place_category', function (Blueprint $table) {
            $table->foreignUlid('place_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('category_id')->constrained()->cascadeOnDelete();
            $table->primary(['place_id', 'category_id']);
            $table->index('category_id');
        });

        Schema::create('place_area', function (Blueprint $table) {
            $table->foreignUlid('place_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('area_id')->constrained()->cascadeOnDelete();
            $table->primary(['place_id', 'area_id']);
            $table->index('area_id');
        });

        Schema::create('place_photos', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('place_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('media_id')->constrained('media')->cascadeOnDelete();
            $table->string('caption')->nullable();
            $table->string('status', 20)->default('APPROVED');
            $table->foreignUlid('submitted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['place_id', 'status', 'sort_order']);
        });

        Schema::create('place_facilities', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('place_id')->constrained()->cascadeOnDelete();
            $table->string('name', 100);
            $table->string('notes')->nullable();
            $table->timestamps();

            $table->unique(['place_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('place_facilities');
        Schema::dropIfExists('place_photos');
        Schema::dropIfExists('place_area');
        Schema::dropIfExists('place_category');
        Schema::dropIfExists('places');
    }
};
