<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\DepartmentGroupPhoto;
use App\Models\Student;
use App\Models\User;
use App\Models\Yearbook;
use App\Support\DepartmentGroupPhotoMedia;
use App\Support\StudentPhotoMedia;
use Illuminate\Http\UploadedFile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

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

        $profile->load([
            'department:id,department_template_id,yearbook_id,group_photo',
            'department.template:id,label,full_name,description',
            'department.groupPhotos:id,department_id,photo,sort_order',
            'yearbook:id,graduating_year,hero_description',
        ]);

        return response()->json([
            'profile' => $this->profilePayload($profile),
            'options' => [
                'years' => Yearbook::query()
                    ->orderByDesc('graduating_year')
                    ->pluck('graduating_year')
                    ->values(),
                'departments' => Department::query()
                    ->with([
                        'template:id,label,full_name,description',
                        'yearbook:id,graduating_year',
                        'groupPhotos:id,department_id,photo,sort_order',
                    ])
                    ->get(['id', 'department_template_id', 'yearbook_id', 'group_photo'])
                    ->sortBy(fn (Department $department) => strtoupper((string) ($department->label ?? '')))
                    ->map(function (Department $department): array {
                        $groupPhotos = $this->departmentGroupPhotos($department);
                        $groupPhotoItems = $this->departmentGroupPhotoItems($department);

                        return [
                            'id' => $department->id,
                            'label' => $department->label,
                            'full_name' => $department->full_name,
                            'graduating_year' => $department->yearbook?->graduating_year,
                            'group_photo' => $groupPhotos[0] ?? null,
                            'group_photos' => $groupPhotos,
                            'group_photo_items' => $groupPhotoItems,
                        ];
                    })
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
            'class_motto' => ['nullable', 'string', 'max:2000'],
            'department_id' => ['prohibited'],
            'graduating_year' => ['prohibited'],
        ]);

        $profile = $this->resolveProfile($request->user());

        if (! $profile) {
            return response()->json([
                'message' => 'Student profile not found.',
            ], 404);
        }

        $profile->loadMissing([
            'department:id,department_template_id,yearbook_id,group_photo',
            'department.template:id,label,full_name,description',
            'department.groupPhotos:id,department_id,photo,sort_order',
            'yearbook:id,graduating_year,hero_description',
        ]);

        $department = $profile->department;
        $yearbook = $profile->yearbook;

        if (! $department || ! $yearbook) {
            return response()->json([
                'message' => 'Student profile is missing department or year assignment.',
            ], 422);
        }

        $photo = $this->resolvePhotoValue($profile, $validated, $request);
        $this->updateYearbookClassMotto($yearbook, $validated);

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

        $profile->load([
            'department:id,department_template_id,yearbook_id,group_photo',
            'department.template:id,label,full_name,description',
            'department.groupPhotos:id,department_id,photo,sort_order',
            'yearbook:id,graduating_year,hero_description',
        ]);

        return response()->json([
            'message' => 'Profile updated successfully.',
            'profile' => $this->profilePayload($profile),
        ]);
    }

    public function uploadDepartmentGroupPhotos(Request $request): JsonResponse
    {
        $request->validate([
            'department_group_photo_upload' => ['nullable', 'file', 'image', 'max:4096'],
            'department_group_photo_uploads' => ['nullable', 'array', 'max:10'],
            'department_group_photo_uploads.*' => ['file', 'image', 'max:4096'],
        ]);

        $profile = $this->resolveProfile($request->user());

        if (! $profile) {
            return response()->json([
                'message' => 'Student profile not found.',
            ], 404);
        }

        $profile->loadMissing([
            'department:id,department_template_id,yearbook_id,group_photo',
            'department.template:id,label,full_name,description',
            'department.groupPhotos:id,department_id,photo,sort_order',
        ]);

        $department = $profile->department;

        if (! $department) {
            return response()->json([
                'message' => 'Department not found for this profile.',
            ], 422);
        }

        $uploadedCount = $this->appendDepartmentGroupPhotos($department, $request);

        if ($uploadedCount === 0) {
            return response()->json([
                'message' => 'Please upload at least one image.',
            ], 422);
        }

        $department->refresh()->load('groupPhotos:id,department_id,photo,sort_order');

        return response()->json([
            'message' => 'Department group photo updated successfully.',
            'department' => $this->departmentPayload($department),
        ]);
    }

    public function reorderDepartmentGroupPhotos(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'photo_ids' => ['required', 'array', 'min:1'],
            'photo_ids.*' => ['required', 'integer', 'distinct', Rule::exists('department_group_photos', 'id')],
        ]);

        $profile = $this->resolveProfile($request->user());

        if (! $profile) {
            return response()->json([
                'message' => 'Student profile not found.',
            ], 404);
        }

        $profile->loadMissing([
            'department:id,department_template_id,yearbook_id,group_photo',
            'department.template:id,label,full_name,description',
            'department.groupPhotos:id,department_id,photo,sort_order',
        ]);

        $department = $profile->department;

        if (! $department) {
            return response()->json([
                'message' => 'Department not found for this profile.',
            ], 422);
        }

        $currentIds = $department->groupPhotos
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->values();
        $nextIds = collect($validated['photo_ids'])
            ->map(fn ($id) => (int) $id)
            ->values();

        $sameCount = $currentIds->count() === $nextIds->count();
        $sameSet = $sameCount
            && $currentIds->diff($nextIds)->isEmpty()
            && $nextIds->diff($currentIds)->isEmpty();

        if (! $sameSet) {
            throw ValidationException::withMessages([
                'photo_ids' => 'Photo order is invalid. Use the X button to remove photos.',
            ]);
        }

        DB::transaction(function () use ($nextIds): void {
            $nextIds->values()->each(function (int $photoId, int $index): void {
                DepartmentGroupPhoto::query()
                    ->whereKey($photoId)
                    ->update(['sort_order' => $index + 1]);
            });
        });

        $department->refresh()->load('groupPhotos:id,department_id,photo,sort_order');
        $this->syncDepartmentPrimaryGroupPhoto($department);
        $department->refresh()->load('groupPhotos:id,department_id,photo,sort_order');

        return response()->json([
            'message' => 'Department group photo sequence updated.',
            'department' => $this->departmentPayload($department),
        ]);
    }

    public function deleteDepartmentGroupPhoto(Request $request, DepartmentGroupPhoto $departmentGroupPhoto): JsonResponse
    {
        $profile = $this->resolveProfile($request->user());

        if (! $profile) {
            return response()->json([
                'message' => 'Student profile not found.',
            ], 404);
        }

        $profile->loadMissing([
            'department:id,department_template_id,yearbook_id,group_photo',
            'department.template:id,label,full_name,description',
            'department.groupPhotos:id,department_id,photo,sort_order',
        ]);

        $department = $profile->department;

        if (! $department) {
            return response()->json([
                'message' => 'Department not found for this profile.',
            ], 422);
        }

        if ((int) $departmentGroupPhoto->department_id !== (int) $department->id) {
            return response()->json([
                'message' => 'You can only remove photos from your own department.',
            ], 403);
        }

        $this->deleteManagedDepartmentGroupPhoto($departmentGroupPhoto->photo);
        $departmentGroupPhoto->delete();

        $this->resequenceDepartmentGroupPhotos($department);
        $department->refresh()->load('groupPhotos:id,department_id,photo,sort_order');
        $this->syncDepartmentPrimaryGroupPhoto($department);
        $department->refresh()->load('groupPhotos:id,department_id,photo,sort_order');

        return response()->json([
            'message' => 'Department group photo removed.',
            'department' => $this->departmentPayload($department),
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

    private function appendDepartmentGroupPhotos(Department $department, Request $request): int
    {
        $files = $request->file('department_group_photo_uploads', []);

        if (! is_array($files)) {
            $files = [];
        }

        $singleUpload = $request->file('department_group_photo_upload');

        if ($singleUpload instanceof UploadedFile) {
            $files[] = $singleUpload;
        }

        $validatedUploads = collect($files)
            ->filter(fn ($file) => $file instanceof UploadedFile)
            ->values();

        if ($validatedUploads->isEmpty()) {
            return 0;
        }

        $nextSortOrder = (int) $department->groupPhotos()->max('sort_order');
        $firstStoredPhoto = null;

        foreach ($validatedUploads as $upload) {
            $storedPhoto = $this->storeUploadedDepartmentGroupPhoto($upload);

            if (! $firstStoredPhoto) {
                $firstStoredPhoto = $storedPhoto;
            }

            $department->groupPhotos()->create([
                'photo' => $storedPhoto,
                'sort_order' => ++$nextSortOrder,
            ]);
        }

        if (! filled($department->group_photo) && is_string($firstStoredPhoto)) {
            $department->group_photo = $firstStoredPhoto;
            $department->save();
        }

        $this->syncDepartmentPrimaryGroupPhoto($department);

        return $validatedUploads->count();
    }

    private function storeUploadedDepartmentGroupPhoto(UploadedFile $file): string
    {
        $path = $file->store(DepartmentGroupPhotoMedia::DIRECTORY, 'public');

        return DepartmentGroupPhotoMedia::publicUrlForStoragePath($path);
    }

    private function deleteManagedPhoto(?string $photoUrl): void
    {
        $storageRelativePath = StudentPhotoMedia::storagePathFromValue($photoUrl);

        if (is_string($storageRelativePath) && $storageRelativePath !== '') {
            Storage::disk('public')->delete($storageRelativePath);
        }
    }

    private function deleteManagedDepartmentGroupPhoto(?string $photoUrl): void
    {
        $storageRelativePath = DepartmentGroupPhotoMedia::storagePathFromValue($photoUrl);

        if (is_string($storageRelativePath) && $storageRelativePath !== '') {
            Storage::disk('public')->delete($storageRelativePath);
        }
    }

    private function isProfileCompleted(array $payload, ?string $photo = null): bool
    {
        return filled($payload['name'])
            && filled($photo ?? ($payload['photo'] ?? null))
            && filled($payload['motto'] ?? null)
            && filled($payload['badge'] ?? null);
    }

    private function updateYearbookClassMotto(Yearbook $yearbook, array $payload): void
    {
        if (! array_key_exists('class_motto', $payload)) {
            return;
        }

        $nextMotto = trim((string) ($payload['class_motto'] ?? ''));

        if ($nextMotto === '') {
            return;
        }

        if ($yearbook->hero_description === $nextMotto) {
            return;
        }

        $yearbook->hero_description = $nextMotto;
        $yearbook->save();
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
            'class_motto' => $profile->yearbook?->hero_description,
            'is_profile_completed' => (bool) $profile->is_profile_completed,
            'department' => [
                'id' => $profile->department?->id,
                'label' => $profile->department?->label,
                'full_name' => $profile->department?->full_name,
                'group_photo' => $this->departmentGroupPhotos($profile->department)[0] ?? null,
                'group_photos' => $this->departmentGroupPhotos($profile->department),
                'group_photo_items' => $this->departmentGroupPhotoItems($profile->department),
            ],
        ];
    }

    private function departmentGroupPhotos(?Department $department): array
    {
        if (! $department) {
            return [];
        }

        $groupPhotos = collect($this->departmentGroupPhotoItems($department))
            ->pluck('photo')
            ->values();

        if ($groupPhotos->isNotEmpty()) {
            return $groupPhotos->all();
        }

        $singlePhoto = DepartmentGroupPhotoMedia::normalizePublicUrl($department->group_photo);

        if (is_string($singlePhoto) && trim($singlePhoto) !== '') {
            return [$singlePhoto];
        }

        return [];
    }

    private function departmentGroupPhotoItems(?Department $department): array
    {
        if (! $department) {
            return [];
        }

        return $department->groupPhotos
            ->map(function (DepartmentGroupPhoto $groupPhoto): array {
                return [
                    'id' => $groupPhoto->id,
                    'photo' => DepartmentGroupPhotoMedia::normalizePublicUrl($groupPhoto->photo),
                    'sort_order' => $groupPhoto->sort_order,
                ];
            })
            ->filter(fn (array $item) => is_string($item['photo']) && trim($item['photo']) !== '')
            ->values()
            ->all();
    }

    private function departmentPayload(Department $department): array
    {
        $department->loadMissing('template:id,label,full_name,description');

        $groupPhotoItems = $this->departmentGroupPhotoItems($department);
        $groupPhotos = collect($groupPhotoItems)->pluck('photo')->values()->all();

        return [
            'id' => $department->id,
            'label' => $department->label,
            'full_name' => $department->full_name,
            'group_photo' => $groupPhotos[0] ?? DepartmentGroupPhotoMedia::normalizePublicUrl($department->group_photo),
            'group_photos' => $groupPhotos,
            'group_photo_items' => $groupPhotoItems,
        ];
    }

    private function resequenceDepartmentGroupPhotos(Department $department): void
    {
        $department->groupPhotos()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->values()
            ->each(function (DepartmentGroupPhoto $groupPhoto, int $index): void {
                if ((int) $groupPhoto->sort_order === $index + 1) {
                    return;
                }

                $groupPhoto->sort_order = $index + 1;
                $groupPhoto->save();
            });
    }

    private function syncDepartmentPrimaryGroupPhoto(Department $department): void
    {
        $firstPhoto = $department->groupPhotos()->orderBy('sort_order')->orderBy('id')->first();

        $primaryPhoto = $firstPhoto?->photo;

        if ($department->group_photo !== $primaryPhoto) {
            $department->group_photo = $primaryPhoto;
            $department->save();
        }
    }
}
