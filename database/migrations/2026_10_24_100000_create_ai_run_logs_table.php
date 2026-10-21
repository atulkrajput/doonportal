<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Step-by-step log of each discovery run: every OpenStreetMap, web search
 * and AI call with its result, duration and tokens, so staff can see what a
 * run did (or where it stopped). Also counts web searches against the
 * monthly plan.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_run_logs', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('run_id')->nullable()->constrained('ai_runs')->cascadeOnDelete(); // null: key test from settings
            $table->string('service', 10);          // run | osm | web | ai
            $table->string('level', 10);            // info | warning | error
            $table->string('category_slug', 120)->nullable();
            $table->string('message', 500);
            $table->unsignedSmallInteger('http_status')->nullable();
            $table->unsignedInteger('duration_ms')->nullable();
            $table->unsignedInteger('tokens')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['run_id', 'created_at']);
            $table->index(['service', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_run_logs');
    }
};
