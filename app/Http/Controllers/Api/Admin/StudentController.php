<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    public function index(): JsonResponse
    {
        $students = Student::query()
            ->with([
                'user:id,email,role,is_active',
                'department:id,label,full_name',
                'yearbook:id,graduating_year',
                'registrationLink:id,title',
            ])
            ->orderBy('name')
            ->get()
            ->map(fn (Student $student) => $this->studentPayload($student))
            ->values();

        return response()->json([
            'students' => $students,
        ]);
    }

    public function updateStatus(Request $request, Student $student): JsonResponse
    {
        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $student->loadMissing([
            'user:id,email,role,is_active',
            'department:id,label,full_name',
            'yearbook:id,graduating_year',
            'registrationLink:id,title',
        ]);

        if (! $student->user) {
            return response()->json([
                'message' => 'This student record has no linked login account.',
            ], 422);
        }

        $student->user->is_active = (bool) $validated['is_active'];
        $student->user->save();
        $student->user->refresh();

        return response()->json([
            'message' => $student->user->is_active
                ? 'Student account activated successfully.'
                : 'Student account deactivated successfully.',
            'student' => $this->studentPayload($student->fresh([
                'user:id,email,role,is_active',
                'department:id,label,full_name',
                'yearbook:id,graduating_year',
                'registrationLink:id,title',
            ])),
        ]);
    }

    private function studentPayload(Student $student): array
    {
        return [
            'id' => $student->id,
            'user_id' => $student->user?->id,
            'name' => $student->name,
            'email' => $student->user?->email,
            'role' => $student->user?->role ?? 'student',
            'is_active' => (bool) ($student->user?->is_active ?? false),
            'department' => $student->department?->label,
            'department_full_name' => $student->department?->full_name,
            'graduating_year' => $student->yearbook?->graduating_year,
            'is_profile_completed' => (bool) $student->is_profile_completed,
            'registration_link_title' => $student->registrationLink?->title,
        ];
    }
}
