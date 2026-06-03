<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\SchoolSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SchoolSettingController extends Controller
{
    private function resolveOrCreate(): SchoolSetting
    {
        return SchoolSetting::query()->firstOrCreate(
            ['id' => 1],
            [
                'school_name' => config('app.name', 'School'),
                'graduates_content_alignment' => SchoolSetting::ALIGN_LEFT,
                'external_system_enabled' => true,
            ],
        );
    }

    public function show(): JsonResponse
    {
        $setting = $this->resolveOrCreate();

        return response()->json([
            'school_setting' => [
                'school_name' => $setting->school_name,
                'graduates_content_alignment' => $setting->graduates_content_alignment ?? SchoolSetting::ALIGN_LEFT,
                'external_system_enabled' => (bool) ($setting->external_system_enabled ?? true),
            ],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'school_name' => ['required', 'string', 'max:255'],
            'graduates_content_alignment' => ['required', Rule::in(SchoolSetting::allowedAlignments())],
        ]);

        $setting = SchoolSetting::query()->updateOrCreate(
            ['id' => 1],
            [
                'school_name' => $validated['school_name'],
                'graduates_content_alignment' => $validated['graduates_content_alignment'],
            ],
        );

        return response()->json([
            'message' => 'School setting updated successfully.',
            'school_setting' => [
                'school_name' => $setting->school_name,
                'graduates_content_alignment' => $setting->graduates_content_alignment,
                'external_system_enabled' => (bool) ($setting->external_system_enabled ?? true),
            ],
        ]);
    }

    public function toggleExternalSystem(): JsonResponse
    {
        $setting = $this->resolveOrCreate();
        $setting->external_system_enabled = ! $setting->external_system_enabled;
        $setting->save();

        return response()->json([
            'external_system_enabled' => $setting->external_system_enabled,
        ]);
    }
}
