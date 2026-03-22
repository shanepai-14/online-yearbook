<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\SchoolSetting;
use App\Models\Yearbook;
use Illuminate\Http\JsonResponse;

class YearbookController extends Controller
{
    public function index(): JsonResponse
    {
        $setting = SchoolSetting::query()->first();
        $schoolName = $setting?->school_name ?? config('app.name', 'School');
        $contentAlignment = $setting?->graduates_content_alignment ?? SchoolSetting::ALIGN_LEFT;

        $yearbooks = Yearbook::query()
            ->with([
                'departments:id,yearbook_id,label,full_name',
                'departments.faculty:id,department_id',
                'students:id,yearbook_id',
            ])
            ->orderByDesc('graduating_year')
            ->get()
            ->map(fn (Yearbook $yearbook) => [
                'id' => $yearbook->id,
                'school_name' => $schoolName,
                'content_alignment' => $contentAlignment,
                'graduating_year' => $yearbook->graduating_year,
                'academic_year_text' => $yearbook->academic_year_text,
                'hero_title' => $yearbook->hero_title,
                'hero_description' => $yearbook->hero_description,
                'graduates_count' => $yearbook->students->count(),
                'programs_count' => $yearbook->departments->count(),
                'faculty_count' => $yearbook->departments->sum(fn ($department) => $department->faculty->count()),
            ])
            ->values();

        return response()->json([
            'yearbooks' => $yearbooks,
        ]);
    }
}
