<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Student;
use App\Models\User;
use App\Models\Yearbook;
use App\Support\StudentPhotoMedia;
use Illuminate\Http\UploadedFile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class StudentProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $profile = $this->resolveProfile($request->user());

        if (! $profile) {
            return response()->json([
                'message' => 'Student profile not found.',
            ], 404);
        }

        $profile->load(['department:id,label,full_name,yearbook_id', 'yearbook:id,graduating_year']);

        return response()->json([
            'profile' => $this->profilePayload($profile),
            'options' => [
                'years' => Yearbook::query()
                    ->orderByDesc('graduating_year')
                    ->pluck('graduating_year')
                    ->values(),
                'departments' => Department::query()
                    ->with('yearbook:id,graduating_year')
                    ->orderBy('label')
                    ->get()
                    ->map(fn ($department) => [
                        'id' => $department->id,
                        'label' => $department->label,
                        'full_name' => $department->full_name,
                        'graduating_year' => $department->yearbook?->graduating_year,
                    ])
                    ->values(),
            ],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'photo' => ['nullable', 'string', 'max:2048'],
            'photo_upload' => ['nullable', 'file', 'image', 'max:3072'],
            'motto' => ['nullable', 'string', 'max:255'],
            'badge' => ['nullable', 'string', 'max:120'],
            'department_id' => ['required', 'integer', Rule::exists('departments', 'id')],
            'graduating_year' => ['required', 'integer', 'min:1900', 'max:2100'],
        ]);

        $yearbook = Yearbook::query()
            ->where('graduating_year', $validated['graduating_year'])
            ->first();

        if (! $yearbook) {
            return response()->json([
                'message' => 'Invalid graduating year.',
            ], 422);
        }

        $department = Department::query()
            ->whereKey($validated['department_id'])
            ->where('yearbook_id', $yearbook->id)
            ->first();

        if (! $department) {
            return response()->json([
                'message' => 'Selected department does not belong to the selected year.',
            ], 422);
        }

        $profile = $this->resolveProfile($request->user());

        if (! $profile) {
            return response()->json([
                'message' => 'Student profile not found.',
            ], 404);
        }

        $photo = $this->resolvePhotoValue($profile, $validated, $request);

        $profile->fill([
            'name' => $validated['name'],
            'photo' => $photo,
            'motto' => $validated['motto'],
            'badge' => $validated['badge'],
            'department_id' => $department->id,
            'yearbook_id' => $yearbook->id,
            'is_profile_completed' => $this->isProfileCompleted($validated, $photo),
        ]);
        $profile->save();

        $profile->load(['department:id,label,full_name,yearbook_id', 'yearbook:id,graduating_year']);

        return response()->json([
            'message' => 'Profile updated successfully.',
            'profile' => $this->profilePayload($profile),
        ]);
    }

    private function resolveProfile(User $user): ?Student
    {
        $existing = $user->student;

        if ($existing) {
            return $existing;
        }

        if (! $user->isStudent()) {
            return null;
        }

        $defaultYearbook = Yearbook::query()
            ->orderByDesc('graduating_year')
            ->with('departments:id,yearbook_id')
            ->first();

        $defaultDepartment = $defaultYearbook?->departments->first();

        if (! $defaultYearbook || ! $defaultDepartment) {
            return null;
        }

        return Student::query()->create([
            'user_id' => $user->id,
            'department_id' => $defaultDepartment->id,
            'yearbook_id' => $defaultYearbook->id,
            'name' => $user->name,
            'photo' => null,
            'motto' => null,
            'badge' => null,
            'is_profile_completed' => false,
        ]);
    }

    private function resolvePhotoValue(Student $profile, array $validated, Request $request): ?string
    {
        if ($request->hasFile('photo_upload')) {
            return $this->storeUploadedPhoto($request->file('photo_upload'), $profile->photo);
        }

        return StudentPhotoMedia::normalizePublicUrl($validated['photo'] ?? $profile->photo);
    }

    private function storeUploadedPhoto(UploadedFile $file, ?string $previousPhoto): string
    {
        $this->deleteManagedPhoto($previousPhoto);

        $path = $file->store('student-photos', 'public');

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
        return filled($payload['name'])
            && filled($photo ?? ($payload['photo'] ?? null))
            && filled($payload['motto'] ?? null)
            && filled($payload['badge'] ?? null)
            && ! empty($payload['department_id'])
            && ! empty($payload['graduating_year']);
    }

    private function profilePayload(Student $profile): array
    {
        return [
            'id' => $profile->id,
            'name' => $profile->name,
            'photo' => StudentPhotoMedia::normalizePublicUrl($profile->photo),
            'motto' => $profile->motto,
            'badge' => $profile->badge,
            'department_id' => $profile->department_id,
            'graduating_year' => $profile->yearbook?->graduating_year,
            'is_profile_completed' => (bool) $profile->is_profile_completed,
            'department' => [
                'id' => $profile->department?->id,
                'label' => $profile->department?->label,
                'full_name' => $profile->department?->full_name,
            ],
        ];
    }
}
