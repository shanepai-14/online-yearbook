<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\DepartmentGroupPhoto;
use App\Models\DepartmentTemplate;
use App\Models\Faculty;
use App\Models\FacultyRole;
use App\Models\SchoolSetting;
use App\Models\Yearbook;
use App\Support\DepartmentGroupPhotoMedia;
use App\Support\FacultyPhotoMedia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class YearbookController extends Controller
{
    public function index(): JsonResponse
    {
        $setting = SchoolSetting::query()->first();
        $schoolName = $setting?->school_name ?? config('app.name', 'School');
        $contentAlignment = $setting?->graduates_content_alignment ?? SchoolSetting::ALIGN_LEFT;

        $yearbooks = Yearbook::query()
            ->with([
                'departments:id,yearbook_id,department_template_id,group_photo',
                'departments.template:id,label,full_name,description',
                'departments.groupPhotos:id,department_id,photo,sort_order',
                'departments.faculty:id,department_id,faculty_role_id,name,role,photo',
                'departments.students:id,department_id',
                'students:id,yearbook_id',
            ])
            ->orderByDesc('graduating_year')
            ->get()
            ->map(fn (Yearbook $yearbook) => $this->yearbookPayload($yearbook, $schoolName, $contentAlignment))
            ->values();

        return response()->json([
            'yearbooks' => $yearbooks,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'graduating_year' => ['required', 'integer', 'min:1900', 'max:2100', Rule::unique('yearbooks', 'graduating_year')],
            'academic_year_text' => ['required', 'string', 'max:255'],
            'hero_title' => ['required', 'string', 'max:255'],
            'hero_description' => ['required', 'string', 'max:4000'],
        ]);

        Yearbook::query()->create($validated);

        return response()->json([
            'message' => 'Yearbook created successfully.',
        ], 201);
    }

    public function update(Request $request, Yearbook $yearbook): JsonResponse
    {
        $validated = $request->validate([
            'graduating_year' => [
                'required',
                'integer',
                'min:1900',
                'max:2100',
                Rule::unique('yearbooks', 'graduating_year')->ignore($yearbook->id),
            ],
            'academic_year_text' => ['required', 'string', 'max:255'],
            'hero_title' => ['required', 'string', 'max:255'],
            'hero_description' => ['required', 'string', 'max:4000'],
        ]);

        $yearbook->update($validated);

        return response()->json([
            'message' => 'Yearbook updated successfully.',
        ]);
    }

    public function destroy(Yearbook $yearbook): JsonResponse
    {
        if ($yearbook->students()->exists()) {
            return response()->json([
                'message' => 'Cannot delete a yearbook that already has student records.',
            ], 422);
        }

        $yearbook->delete();

        return response()->json([
            'message' => 'Yearbook deleted successfully.',
        ]);
    }

    public function storeDepartment(Request $request, Yearbook $yearbook): JsonResponse
    {
        $validated = $request->validate([
            'department_template_id' => ['required', 'integer', Rule::exists('department_templates', 'id')],
        ]);

        $template = DepartmentTemplate::query()->findOrFail($validated['department_template_id']);

        $alreadyExists = $yearbook->departments()
            ->where('department_template_id', $template->id)
            ->exists();

        if ($alreadyExists) {
            return response()->json([
                'message' => 'This department is already added to the selected yearbook.',
            ], 422);
        }

        $yearbook->departments()->create([
            'department_template_id' => $template->id,
        ]);

        return response()->json([
            'message' => 'Department created successfully.',
        ], 201);
    }

    public function updateDepartment(Request $request, Yearbook $yearbook, Department $department): JsonResponse
    {
        if ((int) $department->yearbook_id !== (int) $yearbook->id) {
            return response()->json([
                'message' => 'Department does not belong to the selected yearbook.',
            ], 404);
        }

        $validated = $request->validate([
            'department_template_id' => ['required', 'integer', Rule::exists('department_templates', 'id')],
        ]);

        $template = DepartmentTemplate::query()->findOrFail($validated['department_template_id']);

        $alreadyExists = $yearbook->departments()
            ->where('department_template_id', $template->id)
            ->where('id', '!=', $department->id)
            ->exists();

        if ($alreadyExists) {
            return response()->json([
                'message' => 'This department is already added to the selected yearbook.',
            ], 422);
        }

        $department->update([
            'department_template_id' => $template->id,
        ]);

        return response()->json([
            'message' => 'Department updated successfully.',
        ]);
    }

    public function destroyDepartment(Yearbook $yearbook, Department $department): JsonResponse
    {
        if ((int) $department->yearbook_id !== (int) $yearbook->id) {
            return response()->json([
                'message' => 'Department does not belong to the selected yearbook.',
            ], 404);
        }

        if ($department->students()->exists()) {
            return response()->json([
                'message' => 'Cannot delete a department that already has student records.',
            ], 422);
        }

        $department->delete();

        return response()->json([
            'message' => 'Department deleted successfully.',
        ]);
    }

    public function uploadDepartmentGroupPhotos(Request $request, Department $department): JsonResponse
    {
        $request->validate([
            'department_group_photo_upload' => ['nullable', 'file', 'image', 'max:4096'],
            'department_group_photo_uploads' => ['nullable', 'array', 'max:10'],
            'department_group_photo_uploads.*' => ['file', 'image', 'max:4096'],
        ]);

        $uploadedCount = $this->appendDepartmentGroupPhotos($department, $request);

        if ($uploadedCount === 0) {
            return response()->json([
                'message' => 'Please upload at least one image.',
            ], 422);
        }

        $department->refresh()->load([
            'groupPhotos:id,department_id,photo,sort_order',
            'faculty:id,department_id,faculty_role_id,name,role,photo',
            'students:id,department_id',
        ]);

        return response()->json([
            'message' => 'Department group photo updated successfully.',
            'department' => $this->departmentPayload($department),
        ]);
    }

    public function reorderDepartmentGroupPhotos(Request $request, Department $department): JsonResponse
    {
        $validated = $request->validate([
            'photo_ids' => ['required', 'array', 'min:1'],
            'photo_ids.*' => ['required', 'integer', 'distinct', Rule::exists('department_group_photos', 'id')],
        ]);

        $department->loadMissing('groupPhotos:id,department_id,photo,sort_order');

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
                'photo_ids' => 'Photo order is invalid. Remove photos using the X button.',
            ]);
        }

        DB::transaction(function () use ($nextIds): void {
            $nextIds->values()->each(function (int $photoId, int $index): void {
                DepartmentGroupPhoto::query()
                    ->whereKey($photoId)
                    ->update(['sort_order' => $index + 1]);
            });
        });

        $department->refresh()->load([
            'groupPhotos:id,department_id,photo,sort_order',
            'faculty:id,department_id,faculty_role_id,name,role,photo',
            'students:id,department_id',
        ]);
        $this->syncDepartmentPrimaryGroupPhoto($department);
        $department->refresh()->load([
            'groupPhotos:id,department_id,photo,sort_order',
            'faculty:id,department_id,faculty_role_id,name,role,photo',
            'students:id,department_id',
        ]);

        return response()->json([
            'message' => 'Department group photo sequence updated.',
            'department' => $this->departmentPayload($department),
        ]);
    }

    public function deleteDepartmentGroupPhoto(Department $department, DepartmentGroupPhoto $departmentGroupPhoto): JsonResponse
    {
        if ((int) $departmentGroupPhoto->department_id !== (int) $department->id) {
            return response()->json([
                'message' => 'Photo does not belong to the selected department.',
            ], 404);
        }

        $this->deleteManagedDepartmentGroupPhoto($departmentGroupPhoto->photo);
        $departmentGroupPhoto->delete();

        $this->resequenceDepartmentGroupPhotos($department);

        $department->refresh()->load([
            'groupPhotos:id,department_id,photo,sort_order',
            'faculty:id,department_id,faculty_role_id,name,role,photo',
            'students:id,department_id',
        ]);
        $this->syncDepartmentPrimaryGroupPhoto($department);
        $department->refresh()->load([
            'groupPhotos:id,department_id,photo,sort_order',
            'faculty:id,department_id,faculty_role_id,name,role,photo',
            'students:id,department_id',
        ]);

        return response()->json([
            'message' => 'Department group photo removed.',
            'department' => $this->departmentPayload($department),
        ]);
    }

    public function storeFaculty(Request $request, Department $department): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'faculty_role_id' => ['required', 'integer', Rule::exists('faculty_roles', 'id')],
            'photo_upload' => ['required', 'file', 'image', 'max:4096'],
        ]);

        $photo = $this->storeUploadedFacultyPhoto($validated['photo_upload']);
        $facultyRole = FacultyRole::query()->findOrFail($validated['faculty_role_id']);

        $department->faculty()->create([
            'name' => $validated['name'],
            'faculty_role_id' => $facultyRole->id,
            'role' => $facultyRole->name,
            'photo' => $photo,
        ]);

        return response()->json([
            'message' => 'Faculty member created successfully.',
        ], 201);
    }

    public function updateFaculty(Request $request, Department $department, Faculty $faculty): JsonResponse
    {
        if ((int) $faculty->department_id !== (int) $department->id) {
            return response()->json([
                'message' => 'Faculty member does not belong to the selected department.',
            ], 404);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'faculty_role_id' => ['required', 'integer', Rule::exists('faculty_roles', 'id')],
            'photo_upload' => ['nullable', 'file', 'image', 'max:4096'],
        ]);

        $photo = $faculty->photo;
        $facultyRole = FacultyRole::query()->findOrFail($validated['faculty_role_id']);

        if (array_key_exists('photo_upload', $validated) && $validated['photo_upload'] instanceof UploadedFile) {
            $this->deleteManagedFacultyPhoto($faculty->photo);
            $photo = $this->storeUploadedFacultyPhoto($validated['photo_upload']);
        }

        $faculty->update([
            'name' => $validated['name'],
            'faculty_role_id' => $facultyRole->id,
            'role' => $facultyRole->name,
            'photo' => $photo,
        ]);

        return response()->json([
            'message' => 'Faculty member updated successfully.',
        ]);
    }

    public function destroyFaculty(Department $department, Faculty $faculty): JsonResponse
    {
        if ((int) $faculty->department_id !== (int) $department->id) {
            return response()->json([
                'message' => 'Faculty member does not belong to the selected department.',
            ], 404);
        }

        $this->deleteManagedFacultyPhoto($faculty->photo);
        $faculty->delete();

        return response()->json([
            'message' => 'Faculty member deleted successfully.',
        ]);
    }

    private function yearbookPayload(Yearbook $yearbook, string $schoolName, string $contentAlignment): array
    {
        $departments = $yearbook->departments
            ->map(fn (Department $department) => $this->departmentPayload($department))
            ->values();

        return [
            'id' => $yearbook->id,
            'school_name' => $schoolName,
            'content_alignment' => $contentAlignment,
            'graduating_year' => $yearbook->graduating_year,
            'academic_year_text' => $yearbook->academic_year_text,
            'hero_title' => $yearbook->hero_title,
            'hero_description' => $yearbook->hero_description,
            'graduates_count' => $yearbook->students->count(),
            'programs_count' => $departments->count(),
            'faculty_count' => $departments->sum(fn (array $department) => $department['faculty_count']),
            'departments' => $departments,
        ];
    }

    private function departmentPayload(Department $department): array
    {
        $department->loadMissing('template:id,label,full_name,description');

        $facultyMembers = $department->faculty
            ->map(fn (Faculty $faculty) => [
                'id' => $faculty->id,
                'department_id' => $faculty->department_id,
                'faculty_role_id' => $faculty->faculty_role_id,
                'name' => $faculty->name,
                'role' => $faculty->role,
                'photo' => FacultyPhotoMedia::normalizePublicUrl($faculty->photo),
            ])
            ->values();

        return [
            'id' => $department->id,
            'yearbook_id' => $department->yearbook_id,
            'department_template_id' => $department->department_template_id,
            'label' => $department->label,
            'full_name' => $department->full_name,
            'description' => $department->description,
            'group_photo' => $this->departmentGroupPhotos($department)[0] ?? null,
            'group_photos' => $this->departmentGroupPhotos($department),
            'group_photo_items' => $this->departmentGroupPhotoItems($department),
            'students_count' => $department->students->count(),
            'faculty_count' => $facultyMembers->count(),
            'faculty' => $facultyMembers,
        ];
    }

    private function storeUploadedFacultyPhoto(UploadedFile $file): string
    {
        $path = $file->store(FacultyPhotoMedia::DIRECTORY, 'public');

        return FacultyPhotoMedia::publicUrlForStoragePath($path);
    }

    private function deleteManagedFacultyPhoto(?string $photo): void
    {
        $storageRelativePath = FacultyPhotoMedia::storagePathFromValue($photo);

        if (is_string($storageRelativePath) && $storageRelativePath !== '') {
            Storage::disk('public')->delete($storageRelativePath);
        }
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

    private function deleteManagedDepartmentGroupPhoto(?string $photo): void
    {
        $storageRelativePath = DepartmentGroupPhotoMedia::storagePathFromValue($photo);

        if (is_string($storageRelativePath) && $storageRelativePath !== '') {
            Storage::disk('public')->delete($storageRelativePath);
        }
    }

    private function departmentGroupPhotoItems(Department $department): array
    {
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

    private function departmentGroupPhotos(Department $department): array
    {
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
