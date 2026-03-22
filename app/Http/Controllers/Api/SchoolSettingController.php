<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SchoolSetting;
use Illuminate\Http\JsonResponse;

class SchoolSettingController extends Controller
{
    public function show(): JsonResponse
    {
        $setting = SchoolSetting::query()->firstOrCreate(
            ['id' => 1],
            [
                'school_name' => config('app.name', 'School'),
                'graduates_content_alignment' => SchoolSetting::ALIGN_LEFT,
            ],
        );

        return response()->json([
            'school_setting' => [
                'school_name' => $setting->school_name,
            ],
        ]);
    }
}
