<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\RegistrationLink;
use App\Models\Student;
use App\Models\User;
use App\Models\Yearbook;
use App\Support\StudentPhotoMedia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class RegistrationLinkController extends Controller
{
    public function show(string $token): JsonResponse
    {
        $link = RegistrationLink::query()
            ->where('token', $token)
            ->with([
                'yearbook:id,graduating_year,academic_year_text',
                'department:id,department_template_id,yearbook_id',
                'department.template:id,label,full_name,description',
                'department.yearbook:id,graduating_year',
            ])
            ->first();

        if (! $link) {
            return response()->json([
                'message' => 'Registration link not found.',
            ], 404);
        }

        return response()->json([
            'registration_link' => $this->publicLinkPayload($link),
            'options' => $this->optionsPayload($link),
        ]);
    }

    public function register(string $token, Request $request): JsonResponse
    {
        $link = RegistrationLink::query()
            ->where('token', $token)
            ->with([
                'yearbook:id,graduating_year,academic_year_text',
                'department:id,department_template_id,yearbook_id',
                'department.template:id,label,full_name,description',
                'department.yearbook:id,graduating_year',
            ])
            ->first();

        if (! $link) {
            return response()->json([
                'message' => 'Registration link not found.',
            ], 404);
        }

        if (! $link->isCurrentlyAvailable()) {
            return response()->json([
                'message' => $link->availabilityMessage(),
            ], 422);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'motto' => ['nullable', 'string', 'max:255'],
            'badge' => ['nullable', 'string', 'max:120'],
            'photo' => ['nullable', 'string', 'max:2048'],
            'photo_upload' => ['nullable', 'file', 'image', 'max:15360'],
            'yearbook_id' => ['nullable', 'integer', Rule::exists('yearbooks', 'id')],
            'department_id' => ['nullable', 'integer', Rule::exists('departments', 'id')],
        ]);

        [$yearbook, $department] = $this->resolveRegistrationPlacement($link, $validated);
        $photo = $this->resolvePhotoValue($validated, $request);

        DB::transaction(function () use ($validated, $link, $yearbook, $department, $photo): void {
            $user = User::query()->create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => $validated['password'],
                'role' => User::ROLE_STUDENT,
            ]);

            Student::query()->create([
                'user_id' => $user->id,
                'registration_link_id' => $link->id,
                'department_id' => $department->id,
                'yearbook_id' => $yearbook->id,
                'name' => $validated['name'],
                'photo' => $photo,
                'motto' => $validated['motto'] ?? null,
                'badge' => $validated['badge'] ?? null,
                'is_profile_completed' => $this->isProfileCompleted($validated, $photo),
            ]);
        });

        return response()->json([
            'message' => 'Registration completed successfully. You may now sign in.',
        ], 201);
    }

    private function resolveRegistrationPlacement(RegistrationLink $link, array $payload): array
    {
        if ($link->type === RegistrationLink::TYPE_FREE_YEAR_FREE_DEPARTMENT) {
            $yearbookId = $payload['yearbook_id'] ?? null;
            $departmentId = $payload['department_id'] ?? null;

            if (! filled($yearbookId) || ! filled($departmentId)) {
                throw ValidationException::withMessages([
                    'department_id' => 'Please select a year and department.',
                ]);
            }

            $yearbook = Yearbook::query()->find($yearbookId);
            $department = Department::query()
                ->whereKey($departmentId)
                ->where('yearbook_id', $yearbook?->id)
                ->first();

            if (! $yearbook || ! $department) {
                throw ValidationException::withMessages([
                    'department_id' => 'Selected department does not belong to the selected year.',
                ]);
            }

            return [$yearbook, $department];
        }

        if ($link->type === RegistrationLink::TYPE_FIXED_YEAR_SELECT_DEPARTMENT) {
            $yearbook = $link->yearbook;
            $departmentId = $payload['department_id'] ?? null;

            if (! $yearbook || ! filled($departmentId)) {
                throw ValidationException::withMessages([
                    'department_id' => 'Please select a department.',
                ]);
            }

            $department = Department::query()
                ->whereKey($departmentId)
                ->where('yearbook_id', $yearbook->id)
                ->first();

            if (! $department) {
                throw ValidationException::withMessages([
                    'department_id' => 'Selected department does not belong to the fixed year.',
                ]);
            }

            return [$yearbook, $department];
        }

        if ($link->type === RegistrationLink::TYPE_FIXED_DEPARTMENT_SELECT_YEAR) {
            $baseDepartment = $link->department;
            $yearbookId = $payload['yearbook_id'] ?? null;

            if (! $baseDepartment || ! filled($yearbookId)) {
                throw ValidationException::withMessages([
                    'yearbook_id' => 'Please select a year.',
                ]);
            }

            $yearbook = Yearbook::query()->find($yearbookId);

            if (! $yearbook) {
                throw ValidationException::withMessages([
                    'yearbook_id' => 'Selected year is invalid.',
                ]);
            }

            $department = Department::query()
                ->where('yearbook_id', $yearbook->id)
                ->where('department_template_id', $baseDepartment->department_template_id)
                ->first();

            if (! $department) {
                throw ValidationException::withMessages([
                    'yearbook_id' => 'Selected year does not include the fixed department.',
                ]);
            }

            return [$yearbook, $department];
        }

        if ($link->type === RegistrationLink::TYPE_FIXED_YEAR_FIXED_DEPARTMENT) {
            $yearbook = $link->yearbook;
            $department = $link->department;

            if (! $yearbook || ! $department || (int) $department->yearbook_id !== (int) $yearbook->id) {
                throw ValidationException::withMessages([
                    'registration_link' => 'Registration link configuration is invalid.',
                ]);
            }

            return [$yearbook, $department];
        }

        throw ValidationException::withMessages([
            'registration_link' => 'Unsupported registration link type.',
        ]);
    }

    private function optionsPayload(RegistrationLink $link): array
    {
        $yearbooks = Yearbook::query()
            ->orderByDesc('graduating_year')
            ->get(['id', 'graduating_year', 'academic_year_text'])
            ->map(fn (Yearbook $yearbook) => [
                'id' => $yearbook->id,
                'graduating_year' => $yearbook->graduating_year,
                'academic_year_text' => $yearbook->academic_year_text,
            ]);

        $departments = Department::query()
            ->with(['template:id,label,full_name,description', 'yearbook:id,graduating_year'])
            ->get(['id', 'department_template_id', 'yearbook_id'])
            ->sortBy(fn (Department $department) => strtoupper((string) ($department->label ?? '')))
            ->map(fn (Department $department) => [
                'id' => $department->id,
                'label' => $department->label,
                'full_name' => $department->full_name,
                'yearbook_id' => $department->yearbook_id,
                'graduating_year' => $department->yearbook?->graduating_year,
            ]);

        if ($link->type === RegistrationLink::TYPE_FIXED_YEAR_SELECT_DEPARTMENT) {
            $departments = $departments
                ->where('yearbook_id', $link->yearbook_id)
                ->values();
            $yearbooks = $yearbooks
                ->where('id', $link->yearbook_id)
                ->values();
        }

        if ($link->type === RegistrationLink::TYPE_FIXED_DEPARTMENT_SELECT_YEAR) {
            $baseDepartmentTemplateId = $link->department?->department_template_id;

            $matchingDepartments = Department::query()
                ->with(['template:id,label,full_name,description', 'yearbook:id,graduating_year'])
                ->where('department_template_id', $baseDepartmentTemplateId)
                ->orderBy('yearbook_id')
                ->get(['id', 'department_template_id', 'yearbook_id'])
                ->map(fn (Department $department) => [
                    'id' => $department->id,
                    'label' => $department->label,
                    'full_name' => $department->full_name,
                    'yearbook_id' => $department->yearbook_id,
                    'graduating_year' => $department->yearbook?->graduating_year,
                ])
                ->values();

            $yearbookIds = $matchingDepartments->pluck('yearbook_id')->all();

            $yearbooks = $yearbooks
                ->whereIn('id', $yearbookIds)
                ->values();

            $departments = $matchingDepartments;
        }

        if ($link->type === RegistrationLink::TYPE_FIXED_YEAR_FIXED_DEPARTMENT) {
            $departments = $departments
                ->where('id', $link->department_id)
                ->values();
            $yearbooks = $yearbooks
                ->where('id', $link->yearbook_id)
                ->values();
        }

        return [
            'yearbooks' => $yearbooks->values(),
            'departments' => $departments->values(),
        ];
    }

    private function resolvePhotoValue(array $payload, Request $request): ?string
    {
        if ($request->hasFile('photo_upload')) {
            return $this->storeUploadedPhoto($request->file('photo_upload'));
        }

        return StudentPhotoMedia::normalizePublicUrl($payload['photo'] ?? null);
    }

    private function storeUploadedPhoto(UploadedFile $file): string
    {
        $path = $file->store('student-photos', 'public');

        return StudentPhotoMedia::publicUrlForStoragePath($path);
    }

    private function isProfileCompleted(array $payload, ?string $photo = null): bool
    {
        return filled($payload['name'])
            && filled($photo ?? ($payload['photo'] ?? null))
            && filled($payload['motto'] ?? null)
            && filled($payload['badge'] ?? null);
    }

    private function publicLinkPayload(RegistrationLink $link): array
    {
        return [
            'id' => $link->id,
            'title' => $link->title,
            'type' => $link->type,
            'type_label' => RegistrationLink::typeLabel($link->type),
            'description' => $link->description,
            'is_active' => (bool) $link->is_active,
            'starts_at' => $link->starts_at?->toIso8601String(),
            'ends_at' => $link->ends_at?->toIso8601String(),
            'status' => $link->availabilityState(),
            'availability_message' => $link->availabilityMessage(),
            'is_available' => $link->isCurrentlyAvailable(),
            'allows_year_selection' => in_array(
                $link->type,
                [
                    RegistrationLink::TYPE_FREE_YEAR_FREE_DEPARTMENT,
                    RegistrationLink::TYPE_FIXED_DEPARTMENT_SELECT_YEAR,
                ],
                true,
            ),
            'allows_department_selection' => in_array(
                $link->type,
                [
                    RegistrationLink::TYPE_FREE_YEAR_FREE_DEPARTMENT,
                    RegistrationLink::TYPE_FIXED_YEAR_SELECT_DEPARTMENT,
                ],
                true,
            ),
            'year_is_locked' => in_array(
                $link->type,
                [
                    RegistrationLink::TYPE_FIXED_YEAR_SELECT_DEPARTMENT,
                    RegistrationLink::TYPE_FIXED_YEAR_FIXED_DEPARTMENT,
                ],
                true,
            ),
            'department_is_locked' => in_array(
                $link->type,
                [
                    RegistrationLink::TYPE_FIXED_DEPARTMENT_SELECT_YEAR,
                    RegistrationLink::TYPE_FIXED_YEAR_FIXED_DEPARTMENT,
                ],
                true,
            ),
            'fixed_yearbook' => $link->yearbook ? [
                'id' => $link->yearbook->id,
                'graduating_year' => $link->yearbook->graduating_year,
                'academic_year_text' => $link->yearbook->academic_year_text,
            ] : null,
            'fixed_department' => $link->department ? [
                'id' => $link->department->id,
                'label' => $link->department->label,
                'full_name' => $link->department->full_name,
                'department_template_id' => $link->department->department_template_id,
                'yearbook_id' => $link->department->yearbook_id,
                'graduating_year' => $link->department->yearbook?->graduating_year,
            ] : null,
        ];
    }
}
