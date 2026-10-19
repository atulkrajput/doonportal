<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('disk', 30)->default('public');
            $table->string('path')->nullable();
            $table->string('external_url', 2048)->nullable();
            $table->string('mime_type', 100)->nullable();
            $table->unsignedInteger('size_bytes')->nullable();
            $table->unsignedSmallInteger('width')->nullable();
            $table->unsignedSmallInteger('height')->nullable();
            $table->string('alt_text')->nullable();
            $table->string('credit')->nullable();
            $table->string('source_url', 2048)->nullable();
            $table->foreignUlid('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('areas', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('summary')->nullable();
            $table->text('description')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->foreignUlid('cover_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->boolean('is_published')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['is_published', 'sort_order']);
        });

        Schema::create('categories', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('parent_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->string('type', 20);
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('icon', 50)->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['type', 'is_active', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('categories');
        Schema::dropIfExists('areas');
        Schema::dropIfExists('media');
    }
};
