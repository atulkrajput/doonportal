<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The AI data engine's daily discovery: each run looks for new Dehradun
 * businesses (OpenStreetMap, then web search) and queues them for staff
 * review. Nothing here is public until staff approve it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_runs', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('trigger', 20);            // schedule | manual
            $table->string('status', 20);             // running | completed | failed
            $table->foreignUlid('requested_by')->nullable()->constrained('admins')->nullOnDelete();
            $table->string('category_slug', 120)->nullable(); // set when only one category ran
            $table->json('stats')->nullable();        // per-category counts
            $table->unsignedInteger('found_count')->default(0);
            $table->unsignedInteger('ai_tokens')->default(0);
            $table->text('error')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'started_at']);
        });

        Schema::create('ai_discoveries', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('run_id')->nullable()->constrained('ai_runs')->nullOnDelete();
            $table->string('source', 20);             // osm | web
            $table->string('external_id', 191);       // osm "node/123", or the evidence URL for web results
            $table->foreignUlid('category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->json('data');                     // normalised, editable listing fields
            $table->json('evidence')->nullable();     // source URL, raw OSM tags / search snippet
            $table->json('ai')->nullable();           // provider, model, prompt version, confidence, notes
            $table->string('status', 20)->default('PENDING'); // PENDING | APPROVED | REJECTED | DUPLICATE
            $table->foreignUlid('duplicate_of_id')->nullable()->constrained('businesses')->nullOnDelete();
            $table->foreignUlid('business_id')->nullable()->constrained('businesses')->nullOnDelete();
            $table->foreignUlid('reviewer_id')->nullable()->constrained('admins')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_notes')->nullable();
            $table->timestamps();

            // The same OSM element / web page is only ever queued once.
            $table->unique(['source', 'external_id']);
            $table->index(['status', 'category_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_discoveries');
        Schema::dropIfExists('ai_runs');
    }
};
