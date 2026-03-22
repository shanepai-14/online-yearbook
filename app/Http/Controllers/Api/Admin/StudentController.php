<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Student;
use App\Models\User;
use App\Models\Yearbook;
use App\Support\StudentPhotoMedia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class StudentController extends Controller
{
    public function index(): JsonResponse
    {
        $students = Student::query()
            ->with([
                'user:id,email,role,is_active',
                'department:id,department_template_id',
                'department.template:id,label,full_name,description',
                'yearbook:id,graduating_year',
                'registrationLink:id,title',
            ])
            ->orderBy('name')
            ->get()
            ->map(fn (Student $student) => $this->studentPayload($student))
            ->values();

        return response()->json([
            'students' => $students,
            'options' => [
                'yearbooks' => $this->yearbookOptions(),
                'departments' => $this->departmentOptions(),
            ],
        ]);
    }

    public function update(Request $request, Student $student): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'yearbook_id' => ['required', 'integer', Rule::exists('yearbooks', 'id')],
            'department_id' => ['required', 'integer', Rule::exists('departments', 'id')],
            'motto' => ['nullable', 'string', 'max:255'],
            'badge' => ['nullable', 'string', 'max:120'],
            'photo' => ['nullable', 'string', 'max:2048'],
            'photo_upload' => ['nullable', 'file', 'image', 'max:3072'],
            'is_active' => ['required', 'boolean'],
        ]);

        $student->loadMissing([
            'user:id,email,role,is_active',
            'department:id,department_template_id,yearbook_id',
            'department.template:id,label,full_name,description',
            'yearbook:id,graduating_year',
            'registrationLink:id,title',
        ]);

        $department = Department::query()
            ->whereKey($validated['department_id'])
            ->where('yearbook_id', $validated['yearbook_id'])
            ->first();

        if (! $department) {
            throw ValidationException::withMessages([
                'department_id' => 'Selected department does not belong to the selected yearbook.',
            ]);
        }

        $user = $student->user;
        $password = trim((string) ($validated['password'] ?? ''));

        if ($user) {
            $request->validate([
                'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            ]);

            $user->name = $validated['name'];
            $user->email = $validated['email'];
            $user->role = User::ROLE_STUDENT;
            $user->is_active = (bool) $validated['is_active'];

            if ($password !== '') {
                $user->password = $password;
            }

            $user->save();
        } else {
            if ($password === '') {
                throw ValidationException::withMessages([
                    'password' => 'Password is required when creating a login for this student.',
                ]);
            }

            $request->validate([
                'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            ]);

            $user = User::query()->create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => $password,
                'role' => User::ROLE_STUDENT,
                'is_active' => (bool) $validated['is_active'],
            ]);

            $student->user_id = $user->id;
        }

        $photo = $this->resolvePhotoValue($student, $validated, $request);

        $student->fill([
            'yearbook_id' => (int) $validated['yearbook_id'],
            'department_id' => (int) $validated['department_id'],
            'name' => $validated['name'],
            'photo' => $photo,
            'motto' => $validated['motto'] ?? null,
            'badge' => $validated['badge'] ?? null,
            'is_profile_completed' => $this->isProfileCompleted($validated, $photo),
        ]);
        $student->save();

        return response()->json([
            'message' => 'Student updated successfully.',
            'student' => $this->studentPayload($student->fresh([
                'user:id,email,role,is_active',
                'department:id,department_template_id',
                'department.template:id,label,full_name,description',
                'yearbook:id,graduating_year',
                'registrationLink:id,title',
            ])),
        ]);
    }

    public function updateStatus(Request $request, Student $student): JsonResponse
    {
        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $student->loadMissing([
            'user:id,email,role,is_active',
            'department:id,department_template_id',
            'department.template:id,label,full_name,description',
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
                'department:id,department_template_id',
                'department.template:id,label,full_name,description',
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
            'department_id' => $student->department_id,
            'yearbook_id' => $student->yearbook_id,
            'graduating_year' => $student->yearbook?->graduating_year,
            'is_profile_completed' => (bool) $student->is_profile_completed,
            'registration_link_title' => $student->registrationLink?->title,
            'photo' => StudentPhotoMedia::normalizePublicUrl($student->photo),
            'motto' => $student->motto,
            'badge' => $student->badge,
        ];
    }

    private function yearbookOptions(): array
    {
        return Yearbook::query()
            ->orderByDesc('graduating_year')
            ->get(['id', 'graduating_year', 'academic_year_text'])
            ->map(fn (Yearbook $yearbook) => [
                'id' => $yearbook->id,
                'graduating_year' => $yearbook->graduating_year,
                'academic_year_text' => $yearbook->academic_year_text,
            ])
            ->values()
            ->all();
    }

    private function departmentOptions(): array
    {
        return Department::query()
            ->with(['template:id,label,full_name,description', 'yearbook:id,graduating_year'])
            ->get(['id', 'department_template_id', 'yearbook_id'])
            ->sortBy(fn (Department $department) => strtoupper((string) ($department->label ?? '')))
            ->map(fn (Department $department) => [
                'id' => $department->id,
                'yearbook_id' => $department->yearbook_id,
                'graduating_year' => $department->yearbook?->graduating_year,
                'label' => $department->label,
                'full_name' => $department->full_name,
            ])
            ->values()
            ->all();
    }

    private function resolvePhotoValue(Student $student, array $validated, Request $request): ?string
    {
        if ($request->hasFile('photo_upload')) {
            return $this->storeUploadedPhoto($request->file('photo_upload'), $student->photo);
        }

        return StudentPhotoMedia::normalizePublicUrl($validated['photo'] ?? $student->photo);
    }

    private function storeUploadedPhoto(UploadedFile $file, ?string $previousPhoto): string
    {
        $this->deleteManagedPhoto($previousPhoto);
        $path = $file->store(StudentPhotoMedia::DIRECTORY, 'public');

        return StudentPhotoMedia::publicUrlForStoragePath($path);
    }

    private function deleteManagedPhoto(?string $photoUrl): void
    {
        $storageRelativePath = StudentPhotoMedia::storagePathFromValue($photoUrl);

        if (is_string($storageRelativePath) && $storageRelativePath !== '') {
            Storage::disk('public')->delete($storageRelativePath);
        }
    }

    private function isProfileCompleted(array $payload, ?string $photo = null): bool
    {
        return filled($payload['name'] ?? null)
            && filled($photo ?? ($payload['photo'] ?? null))
            && filled($payload['motto'] ?? null)
            && filled($payload['badge'] ?? null);
    }
}
