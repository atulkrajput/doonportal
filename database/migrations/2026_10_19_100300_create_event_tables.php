<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('venues', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('address_line')->nullable();
            $table->foreignUlid('area_id')->nullable()->constrained('areas')->nullOnDelete();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->foreignUlid('business_id')->nullable()->constrained('businesses')->nullOnDelete();
            $table->foreignUlid('place_id')->nullable()->constrained('places')->nullOnDelete();
            $table->unsignedInteger('capacity')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('organizers', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('email')->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('website', 2048)->nullable();
            $table->foreignUlid('user_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('organizer_business', function (Blueprint $table) {
            $table->foreignUlid('organizer_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('business_id')->constrained()->cascadeOnDelete();
            $table->primary(['organizer_id', 'business_id']);
            $table->index('business_id');
        });

        Schema::create('events', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('summary', 500)->nullable();
            $table->text('description')->nullable();
            $table->string('status', 20)->default('DRAFT');
            $table->boolean('is_featured')->default(false);

            // Stored in UTC; `timezone` is the event's local zone for display.
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->string('timezone', 64)->default('Asia/Kolkata');
            $table->boolean('is_all_day')->default(false);
            $table->timestamp('original_starts_at')->nullable(); // set when rescheduled
            $table->string('cancellation_reason')->nullable();

            $table->foreignUlid('venue_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUlid('area_id')->nullable()->constrained('areas')->nullOnDelete();
            $table->foreignUlid('organizer_id')->nullable()->constrained()->nullOnDelete();
            $table->string('online_url', 2048)->nullable();

            $table->boolean('is_free')->default(false);
            $table->unsignedInteger('price_min_paise')->nullable();
            $table->unsignedInteger('price_max_paise')->nullable();
            $table->char('currency', 3)->default('INR');
            $table->string('ticket_url', 2048)->nullable();
            $table->string('age_restriction', 30)->nullable();
            $table->string('contact_phone', 20)->nullable();
            $table->string('contact_email')->nullable();

            $table->foreignUlid('cover_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->foreignUlid('submitted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('published_at')->nullable();
            $table->string('source_name')->nullable();
            $table->string('source_url', 2048)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'starts_at']);
            $table->index(['area_id', 'starts_at']);
        });

        Schema::create('event_categories', function (Blueprint $table) {
            $table->foreignUlid('event_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('category_id')->constrained()->cascadeOnDelete();
            $table->primary(['event_id', 'category_id']);
            $table->index('category_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_categories');
        Schema::dropIfExists('events');
        Schema::dropIfExists('organizer_business');
        Schema::dropIfExists('organizers');
        Schema::dropIfExists('venues');
    }
};
