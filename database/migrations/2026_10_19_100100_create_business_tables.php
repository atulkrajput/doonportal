<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('businesses', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('tagline')->nullable();
            $table->text('description')->nullable();
            $table->string('status', 20)->default('UNVERIFIED');
            $table->boolean('is_published')->default(false);
            $table->boolean('is_featured')->default(false);

            $table->string('address_line')->nullable();
            $table->string('locality')->nullable();
            $table->string('city', 100)->default('Dehradun');
            $table->string('pincode', 10)->nullable();
            $table->foreignUlid('primary_area_id')->nullable()->constrained('areas')->nullOnDelete();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();

            $table->string('phone', 20)->nullable();
            $table->string('whatsapp', 20)->nullable();
            $table->string('email')->nullable();
            $table->string('website', 2048)->nullable();

            $table->unsignedTinyInteger('price_range')->nullable(); // 1 (budget) .. 4 (premium)
            $table->json('amenities')->nullable();
            $table->json('payment_methods')->nullable();

            $table->decimal('rating_avg', 3, 2)->default(0);
            $table->unsignedInteger('rating_count')->default(0);
            $table->unsignedInteger('popularity_score')->default(0);

            $table->foreignUlid('logo_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->foreignUlid('cover_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->foreignUlid('owner_id')->nullable()->constrained('users')->nullOnDelete();

            $table->date('opened_on')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('last_verified_at')->nullable();
            $table->string('source_name')->nullable();
            $table->string('source_url', 2048)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['is_published', 'status']);
            $table->index(['is_published', 'created_at']);
            $table->index(['is_published', 'rating_avg']);
            $table->index('owner_id');
        });

        Schema::create('business_category', function (Blueprint $table) {
            $table->foreignUlid('business_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('category_id')->constrained()->cascadeOnDelete();
            $table->boolean('is_primary')->default(false);
            $table->primary(['business_id', 'category_id']);
            $table->index('category_id');
        });

        Schema::create('business_area', function (Blueprint $table) {
            $table->foreignUlid('business_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('area_id')->constrained()->cascadeOnDelete();
            $table->primary(['business_id', 'area_id']);
            $table->index('area_id');
        });

        Schema::create('business_services', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('business_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedInteger('price_min_paise')->nullable();
            $table->unsignedInteger('price_max_paise')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('business_hours', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('business_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('day_of_week'); // 0 = Sunday .. 6 = Saturday (Asia/Kolkata local time)
            $table->time('opens_at')->nullable();
            $table->time('closes_at')->nullable();
            $table->boolean('is_closed')->default(false);
            $table->timestamps();

            $table->index(['business_id', 'day_of_week']);
        });

        Schema::create('business_hour_exceptions', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('business_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->time('opens_at')->nullable();
            $table->time('closes_at')->nullable();
            $table->boolean('is_closed')->default(true);
            $table->string('note')->nullable();
            $table->timestamps();

            $table->unique(['business_id', 'date']);
        });

        Schema::create('business_photos', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('business_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('media_id')->constrained('media')->cascadeOnDelete();
            $table->string('caption')->nullable();
            $table->string('status', 20)->default('APPROVED');
            $table->foreignUlid('submitted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['business_id', 'status', 'sort_order']);
        });

        Schema::create('business_social_links', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('business_id')->constrained()->cascadeOnDelete();
            $table->string('platform', 30);
            $table->string('url', 2048);
            $table->timestamps();

            $table->unique(['business_id', 'platform']);
        });

        Schema::create('offers', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('business_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->text('terms')->nullable();
            $table->string('discount_label', 100)->nullable();
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['business_id', 'is_active', 'ends_at']);
        });

        Schema::create('business_claims', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('business_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('user_id')->constrained()->cascadeOnDelete();
            $table->string('status', 20)->default('PENDING');
            $table->string('claimant_role', 100)->nullable();
            $table->string('contact_phone', 20)->nullable();
            $table->string('contact_email')->nullable();
            $table->json('evidence')->nullable();
            $table->foreignUlid('reviewer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_notes')->nullable();
            $table->timestamps();

            $table->index(['business_id', 'status']);
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('business_claims');
        Schema::dropIfExists('offers');
        Schema::dropIfExists('business_social_links');
        Schema::dropIfExists('business_photos');
        Schema::dropIfExists('business_hour_exceptions');
        Schema::dropIfExists('business_hours');
        Schema::dropIfExists('business_services');
        Schema::dropIfExists('business_area');
        Schema::dropIfExists('business_category');
        Schema::dropIfExists('businesses');
    }
};
