<?php

use App\Http\Controllers\Api\Admin\StudentController as AdminStudentController;
use App\Http\Controllers\Api\Admin\YearbookController as AdminYearbookController;
use App\Http\Controllers\Api\Admin\SchoolSettingController as AdminSchoolSettingController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\ReactionController;
use App\Http\Controllers\Api\SchoolSettingController;
use App\Http\Controllers\Api\StudentProfileController;
use App\Http\Controllers\Api\YearbookController;
use Illuminate\Support\Facades\Route;

Route::get('/ping', function () {
    return response()->json([
        'status' => 'ok',
        'time' => now()->toIso8601String(),
    ]);
});

Route::middleware('web')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:web');
    Route::get('/me', [AuthController::class, 'me'])->middleware('auth:web');

    Route::get('/school-setting', [SchoolSettingController::class, 'show']);
    Route::get('/yearbooks', [YearbookController::class, 'index']);
    Route::get('/yearbooks/{year}', [YearbookController::class, 'show'])->whereNumber('year');
    Route::get('/reactions/{type}/{targetId}', [ReactionController::class, 'show'])
        ->where('type', 'student|faculty')
        ->whereNumber('targetId');
    Route::post('/reactions/toggle', [ReactionController::class, 'toggle']);

    Route::get('/comments/{type}/{targetId}', [CommentController::class, 'index'])
        ->where('type', 'student|faculty')
        ->whereNumber('targetId');
    Route::post('/comments', [CommentController::class, 'store'])->middleware('throttle:40,1');

    Route::middleware(['auth:web', 'role:student,admin'])
        ->prefix('student')
        ->group(function () {
            Route::get('/profile', [StudentProfileController::class, 'show']);
            Route::post('/profile', [StudentProfileController::class, 'update']);
            Route::put('/profile', [StudentProfileController::class, 'update']);
        });

    Route::middleware(['auth:web', 'role:admin'])
        ->prefix('admin')
        ->group(function () {
            Route::get('/students', [AdminStudentController::class, 'index']);
            Route::get('/yearbooks', [AdminYearbookController::class, 'index']);
            Route::get('/school-setting', [AdminSchoolSettingController::class, 'show']);
            Route::put('/school-setting', [AdminSchoolSettingController::class, 'update']);
        });
});
