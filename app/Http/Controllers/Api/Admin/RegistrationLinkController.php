<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\RegistrationLink;
use App\Models\Yearbook;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class RegistrationLinkController extends Controller
{
    public function index(): JsonResponse
    {
        $links = RegistrationLink::query()
            ->with([
                'yearbook:id,graduating_year,academic_year_text',
                'department:id,label,full_name,yearbook_id',
                'department.yearbook:id,graduating_year',
                'creator:id,name',
            ])
            ->withCount('students')
            ->latest()
            ->get()
            ->map(fn (RegistrationLink $link) => $this->linkPayload($link))
            ->values();

        return response()->json([
            'registration_links' => $links,
            'options' => $this->optionsPayload(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatedPayload($request);

        $link = RegistrationLink::query()->create([
            ...$validated,
            'token' => $this->generateUniqueToken(),
            'created_by' => $request->user()?->id,
        ]);

        $link->load([
            'yearbook:id,graduating_year,academic_year_text',
            'department:id,label,full_name,yearbook_id',
            'department.yearbook:id,graduating_year',
            'creator:id,name',
        ]);
        $link->loadCount('students');

        return response()->json([
            'message' => 'Registration link created successfully.',
            'registration_link' => $this->linkPayload($link),
            'options' => $this->optionsPayload(),
        ], 201);
    }

    public function show(RegistrationLink $registrationLink): JsonResponse
    {
        $registrationLink->load([
            'yearbook:id,graduating_year,academic_year_text',
            'department:id,label,full_name,yearbook_id',
            'department.yearbook:id,graduating_year',
            'creator:id,name',
        ]);
        $registrationLink->loadCount('students');

        return response()->json([
            'registration_link' => $this->linkPayload($registrationLink),
            'options' => $this->optionsPayload(),
        ]);
    }

    public function update(Request $request, RegistrationLink $registrationLink): JsonResponse
    {
        $validated = $this->validatedPayload($request);

        $registrationLink->update($validated);
        $registrationLink->load([
            'yearbook:id,graduating_year,academic_year_text',
            'department:id,label,full_name,yearbook_id',
            'department.yearbook:id,graduating_year',
            'creator:id,name',
        ]);
        $registrationLink->loadCount('students');

        return response()->json([
            'message' => 'Registration link updated successfully.',
            'registration_link' => $this->linkPayload($registrationLink),
            'options' => $this->optionsPayload(),
        ]);
    }

    public function toggle(RegistrationLink $registrationLink): JsonResponse
    {
        $registrationLink->is_active = ! $registrationLink->is_active;
        $registrationLink->save();

        $registrationLink->load([
            'yearbook:id,graduating_year,academic_year_text',
            'department:id,label,full_name,yearbook_id',
            'department.yearbook:id,graduating_year',
            'creator:id,name',
        ]);
        $registrationLink->loadCount('students');

        return response()->json([
            'message' => 'Registration link status updated.',
            'registration_link' => $this->linkPayload($registrationLink),
        ]);
    }

    private function validatedPayload(Request $request): array
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::in(RegistrationLink::allowedTypes())],
            'yearbook_id' => ['nullable', 'integer', Rule::exists('yearbooks', 'id')],
            'department_id' => ['nullable', 'integer', Rule::exists('departments', 'id')],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after:starts_at'],
            'is_active' => ['required', 'boolean'],
            'description' => ['nullable', 'string', 'max:2000'],
        ]);

        $this->enforceTypeRules($validated);

        return $validated;
    }

    private function enforceTypeRules(array $payload): void
    {
        $type = $payload['type'] ?? '';
        $yearbookId = $payload['yearbook_id'] ?? null;
        $departmentId = $payload['department_id'] ?? null;
        $errors = [];

        if ($type === RegistrationLink::TYPE_FREE_YEAR_FREE_DEPARTMENT) {
            if (filled($yearbookId)) {
                $errors['yearbook_id'] = 'Year must be null for this registration type.';
            }
            if (filled($departmentId)) {
                $errors['department_id'] = 'Department must be null for this registration type.';
            }
        }

        if ($type === RegistrationLink::TYPE_FIXED_YEAR_SELECT_DEPARTMENT) {
            if (! filled($yearbookId)) {
                $errors['yearbook_id'] = 'Year is required for this registration type.';
            }
            if (filled($departmentId)) {
                $errors['department_id'] = 'Department must be null for this registration type.';
            }
        }

        if ($type === RegistrationLink::TYPE_FIXED_DEPARTMENT_SELECT_YEAR) {
            if (filled($yearbookId)) {
                $errors['yearbook_id'] = 'Year must be null for this registration type.';
            }
            if (! filled($departmentId)) {
                $errors['department_id'] = 'Department is required for this registration type.';
            }
        }

        if ($type === RegistrationLink::TYPE_FIXED_YEAR_FIXED_DEPARTMENT) {
            if (! filled($yearbookId)) {
                $errors['yearbook_id'] = 'Year is required for this registration type.';
            }
            if (! filled($departmentId)) {
                $errors['department_id'] = 'Department is required for this registration type.';
            }
        }

        if (
            $type === RegistrationLink::TYPE_FIXED_YEAR_FIXED_DEPARTMENT
            && filled($departmentId)
            && filled($yearbookId)
        ) {
            $department = Department::query()->find($departmentId);

            if (! $department || (int) $department->yearbook_id !== (int) $yearbookId) {
                $errors['department_id'] = 'Selected department must belong to the selected year.';
            }
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }
    }

    private function generateUniqueToken(): string
    {
        do {
            $token = Str::lower(Str::random(40));
        } while (RegistrationLink::query()->where('token', $token)->exists());

        return $token;
    }

    private function optionsPayload(): array
    {
        $yearbooks = Yearbook::query()
            ->orderByDesc('graduating_year')
            ->get(['id', 'graduating_year', 'academic_year_text'])
            ->map(fn (Yearbook $yearbook) => [
                'id' => $yearbook->id,
                'graduating_year' => $yearbook->graduating_year,
                'academic_year_text' => $yearbook->academic_year_text,
            ])
            ->values();

        $departments = Department::query()
            ->with('yearbook:id,graduating_year')
            ->orderBy('label')
            ->get(['id', 'label', 'full_name', 'yearbook_id'])
            ->map(fn (Department $department) => [
                'id' => $department->id,
                'label' => $department->label,
                'full_name' => $department->full_name,
                'yearbook_id' => $department->yearbook_id,
                'graduating_year' => $department->yearbook?->graduating_year,
            ])
            ->values();

        return [
            'types' => collect(RegistrationLink::allowedTypes())
                ->map(fn (string $type) => [
                    'value' => $type,
                    'label' => RegistrationLink::typeLabel($type),
                ])
                ->values(),
            'yearbooks' => $yearbooks,
            'departments' => $departments,
        ];
    }

    private function linkPayload(RegistrationLink $link): array
    {
        return [
            'id' => $link->id,
            'title' => $link->title,
            'token' => $link->token,
            'type' => $link->type,
            'type_label' => RegistrationLink::typeLabel($link->type),
            'description' => $link->description,
            'is_active' => (bool) $link->is_active,
            'starts_at' => $link->starts_at?->toIso8601String(),
            'ends_at' => $link->ends_at?->toIso8601String(),
            'status' => $link->availabilityState(),
            'availability_message' => $link->availabilityMessage(),
            'registrations_count' => (int) ($link->students_count ?? 0),
            'registration_url' => url('/register/'.$link->token),
            'yearbook' => $link->yearbook ? [
                'id' => $link->yearbook->id,
                'graduating_year' => $link->yearbook->graduating_year,
                'academic_year_text' => $link->yearbook->academic_year_text,
            ] : null,
            'department' => $link->department ? [
                'id' => $link->department->id,
                'label' => $link->department->label,
                'full_name' => $link->department->full_name,
                'yearbook_id' => $link->department->yearbook_id,
                'graduating_year' => $link->department->yearbook?->graduating_year,
            ] : null,
            'created_by' => $link->creator ? [
                'id' => $link->creator->id,
                'name' => $link->creator->name,
            ] : null,
            'created_at' => $link->created_at?->toIso8601String(),
            'updated_at' => $link->updated_at?->toIso8601String(),
        ];
    }
}
