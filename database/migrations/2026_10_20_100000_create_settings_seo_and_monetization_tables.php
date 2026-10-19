<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Site-wide settings, one row per group (seo, social, tracking). Values are validated per key.
        Schema::create('settings', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('group', 50)->unique();
            $table->json('value');
            $table->foreignUlid('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // Per-URL or per-record SEO overrides. Exactly one of path / entity is set.
        Schema::create('seo_meta', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('path', 255)->nullable()->unique();
            $table->nullableUlidMorphs('entity');
            $table->string('title', 255)->nullable();
            $table->string('description', 320)->nullable();
            $table->foreignUlid('image_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->boolean('noindex')->default(false);
            $table->foreignUlid('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['entity_type', 'entity_id']);
        });

        Schema::create('plans', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->unsignedInteger('price_paise');
            $table->char('currency', 3)->default('INR');
            $table->string('interval', 20); // MONTH, YEAR, ONE_TIME
            $table->json('features')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });

        // Subscriptions are recorded by staff (no payment gateway yet). Revenue reports use
        // only rows with a recorded payment (paid_at + amount_paise).
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('business_id')->constrained()->restrictOnDelete();
            $table->foreignUlid('plan_id')->constrained()->restrictOnDelete();
            $table->string('status', 20)->default('PENDING');
            $table->date('starts_on');
            $table->date('ends_on')->nullable();
            $table->unsignedInteger('amount_paise')->default(0);
            $table->char('currency', 3)->default('INR');
            $table->string('payment_method', 20)->nullable();
            $table->string('payment_reference', 120)->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->text('notes')->nullable();
            $table->foreignUlid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['status', 'ends_on']);
            $table->index('paid_at');
            $table->index(['business_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('plans');
        Schema::dropIfExists('seo_meta');
        Schema::dropIfExists('settings');
    }
};
