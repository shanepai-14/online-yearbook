<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $hasLabel = Schema::hasColumn('departments', 'label');
        $hasFullName = Schema::hasColumn('departments', 'full_name');
        $hasDescription = Schema::hasColumn('departments', 'description');

        if ($hasLabel && ! $this->hasIndex('departments', 'departments_yearbook_id_index')) {
            Schema::table('departments', function (Blueprint $table) {
                $table->index('yearbook_id', 'departments_yearbook_id_index');
            });
        }

        if ($hasLabel && $this->hasIndex('departments', 'departments_yearbook_id_label_unique')) {
            Schema::table('departments', function (Blueprint $table) {
                $table->dropUnique('departments_yearbook_id_label_unique');
            });
        }

        $columnsToDrop = array_values(array_filter([
            $hasLabel ? 'label' : null,
            $hasFullName ? 'full_name' : null,
            $hasDescription ? 'description' : null,
        ]));

        if ($columnsToDrop !== []) {
            Schema::table('departments', function (Blueprint $table) use ($columnsToDrop) {
                $table->dropColumn($columnsToDrop);
            });
        }

        if (! $this->hasIndex('departments', 'departments_yearbook_id_department_template_id_unique')) {
            Schema::table('departments', function (Blueprint $table) {
                $table->unique(
                    ['yearbook_id', 'department_template_id'],
                    'departments_yearbook_id_department_template_id_unique'
                );
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if ($this->hasIndex('departments', 'departments_yearbook_id_department_template_id_unique')) {
            Schema::table('departments', function (Blueprint $table) {
                $table->dropUnique('departments_yearbook_id_department_template_id_unique');
            });
        }

        if (! Schema::hasColumn('departments', 'label')) {
            Schema::table('departments', function (Blueprint $table) {
                $table->string('label', 32)->nullable()->after('department_template_id');
            });
        }

        if (! Schema::hasColumn('departments', 'full_name')) {
            Schema::table('departments', function (Blueprint $table) {
                $table->string('full_name')->nullable()->after('label');
            });
        }

        if (! Schema::hasColumn('departments', 'description')) {
            Schema::table('departments', function (Blueprint $table) {
                $table->text('description')->nullable()->after('full_name');
            });
        }

        DB::table('departments')
            ->leftJoin('department_templates', 'department_templates.id', '=', 'departments.department_template_id')
            ->update([
                'departments.label' => DB::raw('department_templates.label'),
                'departments.full_name' => DB::raw('department_templates.full_name'),
                'departments.description' => DB::raw('department_templates.description'),
            ]);

        if (! $this->hasIndex('departments', 'departments_yearbook_id_label_unique')) {
            Schema::table('departments', function (Blueprint $table) {
                $table->unique(['yearbook_id', 'label'], 'departments_yearbook_id_label_unique');
            });
        }
    }

    private function hasIndex(string $table, string $indexName): bool
    {
        $result = DB::selectOne(
            'select count(*) as aggregate from information_schema.statistics where table_schema = database() and table_name = ? and index_name = ?',
            [$table, $indexName],
        );

        return ((int) ($result->aggregate ?? 0)) > 0;
    }
};
