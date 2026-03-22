<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reaction;
use App\Models\SchoolSetting;
use App\Models\Yearbook;
use App\Support\StudentPhotoMedia;
use App\Support\VisitorFingerprint;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class YearbookController extends Controller
{
    public function show(int $year, Request $request): JsonResponse
    {
        $setting = SchoolSetting::query()->first();
        $schoolName = $setting?->school_name ?? config('app.name', 'School');
        $contentAlignment = $setting?->graduates_content_alignment ?? SchoolSetting::ALIGN_LEFT;
        $visitorKey = VisitorFingerprint::fromRequest($request);

        $yearbook = Yearbook::query()
            ->where('graduating_year', $year)
            ->with([
                'departments:id,yearbook_id,label,full_name,description',
                'departments.faculty:id,department_id,name,role,photo',
                'students:id,yearbook_id,department_id,name,photo,motto,badge',
            ])
            ->first();

        if (! $yearbook) {
            return response()->json([
                'message' => 'Yearbook not found.',
            ], 404);
        }

        $faculty = $yearbook->departments
            ->flatMap(fn ($department) => $department->faculty->map(fn ($member) => [
                'id' => $member->id,
                'name' => $member->name,
                'role' => $member->role,
                'photo' => $member->photo,
                'department_id' => $department->id,
            ]))
            ->values();

        $studentIds = $yearbook->students->pluck('id')->values()->all();
        $facultyIds = $faculty->pluck('id')->values()->all();

        $studentReactionCounts = Reaction::query()
            ->where('target_type', Reaction::TYPE_STUDENT)
            ->whereIn('target_id', $studentIds)
            ->selectRaw('target_id, count(*) as total')
            ->groupBy('target_id')
            ->pluck('total', 'target_id');

        $facultyReactionCounts = Reaction::query()
            ->where('target_type', Reaction::TYPE_FACULTY)
            ->whereIn('target_id', $facultyIds)
            ->selectRaw('target_id, count(*) as total')
            ->groupBy('target_id')
            ->pluck('total', 'target_id');

        $studentReactedLookup = array_fill_keys(
            Reaction::query()
                ->where('target_type', Reaction::TYPE_STUDENT)
                ->whereIn('target_id', $studentIds)
                ->where('visitor_key', $visitorKey)
                ->pluck('target_id')
                ->all(),
            true,
        );

        $facultyReactedLookup = array_fill_keys(
            Reaction::query()
                ->where('target_type', Reaction::TYPE_FACULTY)
                ->whereIn('target_id', $facultyIds)
                ->where('visitor_key', $visitorKey)
                ->pluck('target_id')
                ->all(),
            true,
        );

        return response()->json([
            'school_name' => $schoolName,
            'content_alignment' => $contentAlignment,
            'graduating_year' => $yearbook->graduating_year,
            'academic_year_text' => $yearbook->academic_year_text,
            'hero_title' => $yearbook->hero_title,
            'hero_description' => $yearbook->hero_description,
            'stats' => [
                'graduates_count' => $yearbook->students->count(),
                'programs_count' => $yearbook->departments->count(),
                'faculty_count' => $faculty->count(),
                'years_count' => Yearbook::query()->count(),
            ],
            'departments' => $yearbook->departments->map(fn ($department) => [
                'id' => $department->id,
                'label' => $department->label,
                'full_name' => $department->full_name,
                'description' => $department->description,
            ])->values(),
            'faculty' => $faculty->map(fn (array $member) => [
                'id' => $member['id'],
                'name' => $member['name'],
                'role' => $member['role'],
                'photo' => $member['photo'],
                'department_id' => $member['department_id'],
                'reaction_count' => (int) ($facultyReactionCounts[$member['id']] ?? 0),
                'reacted_by_viewer' => isset($facultyReactedLookup[$member['id']]),
            ])->values(),
            'students' => $yearbook->students->map(fn ($student) => [
                'id' => $student->id,
                'name' => $student->name,
                'photo' => StudentPhotoMedia::normalizePublicUrl($student->photo),
                'motto' => $student->motto,
                'badge' => $student->badge,
                'department_id' => $student->department_id,
                'graduating_year' => $yearbook->graduating_year,
                'reaction_count' => (int) ($studentReactionCounts[$student->id] ?? 0),
                'reacted_by_viewer' => isset($studentReactedLookup[$student->id]),
            ])->values(),
        ]);
    }
}
