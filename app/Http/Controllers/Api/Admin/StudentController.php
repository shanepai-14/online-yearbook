<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Student;
use Illuminate\Http\JsonResponse;

class StudentController extends Controller
{
    public function index(): JsonResponse
    {
        $students = Student::query()
            ->with([
                'user:id,email,role',
                'department:id,label,full_name',
                'yearbook:id,graduating_year',
            ])
            ->orderBy('name')
            ->get()
            ->map(fn (Student $student) => [
                'id' => $student->id,
                'name' => $student->name,
                'email' => $student->user?->email,
                'role' => $student->user?->role ?? 'student',
                'department' => $student->department?->label,
                'department_full_name' => $student->department?->full_name,
                'graduating_year' => $student->yearbook?->graduating_year,
                'is_profile_completed' => (bool) $student->is_profile_completed,
            ])
            ->values();

        return response()->json([
            'students' => $students,
        ]);
    }
}
