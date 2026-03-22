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
        Schema::table('students', function (Blueprint $table) {
            if (! Schema::hasColumn('students', 'registration_link_id')) {
                $table->foreignId('registration_link_id')
                    ->nullable()
                    ->after('user_id')
                    ->constrained('registration_links')
                    ->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            if (Schema::hasColumn('students', 'registration_link_id')) {
                $table->dropConstrainedForeignId('registration_link_id');
            }
        });
    }
};
