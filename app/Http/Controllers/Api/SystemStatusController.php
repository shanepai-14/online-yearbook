<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SchoolSetting;
use Illuminate\Http\JsonResponse;

class SystemStatusController extends Controller
{
    public function show(): JsonResponse
    {
        $setting = SchoolSetting::query()->first();
        $enabled = $setting ? (bool) $setting->external_system_enabled : true;

        return response()->json([
            'enabled' => $enabled,
            'checked_at' => now()->toIso8601String(),
        ]);
    }
}
