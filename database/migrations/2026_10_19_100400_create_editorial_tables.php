<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stories', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('type', 20)->default('STORY');
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('excerpt', 500)->nullable();
            $table->longText('body')->nullable(); // sanitized HTML
            $table->string('status', 20)->default('DRAFT');
            $table->boolean('is_featured')->default(false);
            $table->foreignUlid('author_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUlid('cover_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->unsignedSmallInteger('reading_minutes')->nullable();
            $table->string('seo_title')->nullable();
            $table->string('seo_description', 320)->nullable();
            $table->timestamp('published_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'published_at']);
            $table->index(['type', 'status']);
        });

        Schema::create('story_category', function (Blueprint $table) {
            $table->foreignUlid('story_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('category_id')->constrained()->cascadeOnDelete();
            $table->primary(['story_id', 'category_id']);
            $table->index('category_id');
        });

        Schema::create('story_entities', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('story_id')->constrained()->cascadeOnDelete();
            $table->ulidMorphs('entity');
            $table->timestamps();

            $table->unique(['story_id', 'entity_type', 'entity_id']);
        });

        Schema::create('collections', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->text('selection_criteria')->nullable();
            $table->string('status', 20)->default('DRAFT');
            $table->boolean('is_featured')->default(false);
            $table->foreignUlid('curator_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUlid('cover_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->timestamp('published_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'published_at']);
        });

        Schema::create('collection_items', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('collection_id')->constrained()->cascadeOnDelete();
            $table->ulidMorphs('item');
            $table->unsignedSmallInteger('position')->default(0);
            $table->text('note')->nullable();
            $table->timestamps();

            $table->unique(['collection_id', 'item_type', 'item_id']);
            $table->index(['collection_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('collection_items');
        Schema::dropIfExists('collections');
        Schema::dropIfExists('story_entities');
        Schema::dropIfExists('story_category');
        Schema::dropIfExists('stories');
    }
};
