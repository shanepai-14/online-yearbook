<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\DepartmentTemplate;
use App\Models\FacultyRole;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ReferenceDataController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'department_templates' => DepartmentTemplate::query()
                ->orderBy('label')
                ->get()
                ->map(fn (DepartmentTemplate $template) => $this->departmentTemplatePayload($template))
                ->values(),
            'faculty_roles' => FacultyRole::query()
                ->orderBy('name')
                ->get()
                ->map(fn (FacultyRole $role) => $this->facultyRolePayload($role))
                ->values(),
        ]);
    }

    public function storeDepartmentTemplate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'label' => ['required', 'string', 'max:32', 'alpha_dash:ascii', Rule::unique('department_templates', 'label')],
            'full_name' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:4000'],
        ]);

        $template = DepartmentTemplate::query()->create([
            'label' => strtoupper(trim($validated['label'])),
            'full_name' => trim($validated['full_name']),
            'description' => trim($validated['description']),
        ]);

        return response()->json([
            'message' => 'Department option created successfully.',
            'department_template' => $this->departmentTemplatePayload($template),
        ], 201);
    }

    public function updateDepartmentTemplate(Request $request, DepartmentTemplate $departmentTemplate): JsonResponse
    {
        $validated = $request->validate([
            'label' => [
                'required',
                'string',
                'max:32',
                'alpha_dash:ascii',
                Rule::unique('department_templates', 'label')->ignore($departmentTemplate->id),
            ],
            'full_name' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:4000'],
        ]);

        $departmentTemplate->update([
            'label' => strtoupper(trim($validated['label'])),
            'full_name' => trim($validated['full_name']),
            'description' => trim($validated['description']),
        ]);

        return response()->json([
            'message' => 'Department option updated successfully.',
            'department_template' => $this->departmentTemplatePayload($departmentTemplate->fresh()),
        ]);
    }

    public function destroyDepartmentTemplate(DepartmentTemplate $departmentTemplate): JsonResponse
    {
        if ($departmentTemplate->departments()->exists()) {
            return response()->json([
                'message' => 'Cannot delete a department option that is already in use.',
            ], 422);
        }

        $departmentTemplate->delete();

        return response()->json([
            'message' => 'Department option deleted successfully.',
        ]);
    }

    public function storeFacultyRole(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120', Rule::unique('faculty_roles', 'name')],
        ]);

        $facultyRole = FacultyRole::query()->create([
            'name' => trim($validated['name']),
        ]);

        return response()->json([
            'message' => 'Faculty role created successfully.',
            'faculty_role' => $this->facultyRolePayload($facultyRole),
        ], 201);
    }

    public function updateFacultyRole(Request $request, FacultyRole $facultyRole): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120', Rule::unique('faculty_roles', 'name')->ignore($facultyRole->id)],
        ]);

        $facultyRole->update([
            'name' => trim($validated['name']),
        ]);

        return response()->json([
            'message' => 'Faculty role updated successfully.',
            'faculty_role' => $this->facultyRolePayload($facultyRole->fresh()),
        ]);
    }

    public function destroyFacultyRole(FacultyRole $facultyRole): JsonResponse
    {
        if ($facultyRole->faculty()->exists()) {
            return response()->json([
                'message' => 'Cannot delete a faculty role that is already assigned.',
            ], 422);
        }

        $facultyRole->delete();

        return response()->json([
            'message' => 'Faculty role deleted successfully.',
        ]);
    }

    private function departmentTemplatePayload(DepartmentTemplate $template): array
    {
        return [
            'id' => $template->id,
            'label' => $template->label,
            'full_name' => $template->full_name,
            'description' => $template->description,
        ];
    }

    private function facultyRolePayload(FacultyRole $role): array
    {
        return [
            'id' => $role->id,
            'name' => $role->name,
        ];
    }
}
