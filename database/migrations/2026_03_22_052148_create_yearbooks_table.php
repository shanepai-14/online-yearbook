<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('yearbooks', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('graduating_year')->unique();
            $table->string('academic_year_text');
            $table->string('hero_title');
            $table->text('hero_description');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('yearbooks');
    }
};
