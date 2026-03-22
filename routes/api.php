<?php

use App\Http\Controllers\Api\Admin\StudentController as AdminStudentController;
use App\Http\Controllers\Api\Admin\YearbookController as AdminYearbookController;
use App\Http\Controllers\Api\Admin\SchoolSettingController as AdminSchoolSettingController;
use App\Http\Controllers\Api\Admin\RegistrationLinkController as AdminRegistrationLinkController;
use App\Http\Controllers\Api\Admin\ReferenceDataController as AdminReferenceDataController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\RegistrationLinkController as PublicRegistrationLinkController;
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
    Route::get('/registration-links/{token}', [PublicRegistrationLinkController::class, 'show']);
    Route::post('/register/{token}', [PublicRegistrationLinkController::class, 'register'])->middleware('throttle:20,1');

    Route::middleware(['auth:web', 'role:student,admin'])
        ->prefix('student')
        ->group(function () {
            Route::get('/profile', [StudentProfileController::class, 'show']);
            Route::post('/profile', [StudentProfileController::class, 'update']);
            Route::put('/profile', [StudentProfileController::class, 'update']);
            Route::post('/profile/department-group-photos', [StudentProfileController::class, 'uploadDepartmentGroupPhotos']);
            Route::patch('/profile/department-group-photos/reorder', [StudentProfileController::class, 'reorderDepartmentGroupPhotos']);
            Route::delete('/profile/department-group-photos/{departmentGroupPhoto}', [StudentProfileController::class, 'deleteDepartmentGroupPhoto'])
                ->whereNumber('departmentGroupPhoto');
        });

    Route::middleware(['auth:web', 'role:admin'])
        ->prefix('admin')
        ->group(function () {
            Route::get('/students', [AdminStudentController::class, 'index']);
            Route::put('/students/{student}', [AdminStudentController::class, 'update'])->whereNumber('student');
            Route::patch('/students/{student}/status', [AdminStudentController::class, 'updateStatus'])->whereNumber('student');
            Route::get('/yearbooks', [AdminYearbookController::class, 'index']);
            Route::post('/yearbooks', [AdminYearbookController::class, 'store']);
            Route::put('/yearbooks/{yearbook}', [AdminYearbookController::class, 'update'])->whereNumber('yearbook');
            Route::delete('/yearbooks/{yearbook}', [AdminYearbookController::class, 'destroy'])->whereNumber('yearbook');
            Route::post('/yearbooks/{yearbook}/departments', [AdminYearbookController::class, 'storeDepartment'])->whereNumber('yearbook');
            Route::put('/yearbooks/{yearbook}/departments/{department}', [AdminYearbookController::class, 'updateDepartment'])
                ->whereNumber('yearbook')
                ->whereNumber('department');
            Route::delete('/yearbooks/{yearbook}/departments/{department}', [AdminYearbookController::class, 'destroyDepartment'])
                ->whereNumber('yearbook')
                ->whereNumber('department');
            Route::post('/departments/{department}/faculty', [AdminYearbookController::class, 'storeFaculty'])->whereNumber('department');
            Route::put('/departments/{department}/faculty/{faculty}', [AdminYearbookController::class, 'updateFaculty'])
                ->whereNumber('department')
                ->whereNumber('faculty');
            Route::delete('/departments/{department}/faculty/{faculty}', [AdminYearbookController::class, 'destroyFaculty'])
                ->whereNumber('department')
                ->whereNumber('faculty');
            Route::post('/departments/{department}/group-photos', [AdminYearbookController::class, 'uploadDepartmentGroupPhotos'])
                ->whereNumber('department');
            Route::patch('/departments/{department}/group-photos/reorder', [AdminYearbookController::class, 'reorderDepartmentGroupPhotos'])
                ->whereNumber('department');
            Route::delete('/departments/{department}/group-photos/{departmentGroupPhoto}', [AdminYearbookController::class, 'deleteDepartmentGroupPhoto'])
                ->whereNumber('department')
                ->whereNumber('departmentGroupPhoto');
            Route::get('/school-setting', [AdminSchoolSettingController::class, 'show']);
            Route::put('/school-setting', [AdminSchoolSettingController::class, 'update']);
            Route::get('/registration-links', [AdminRegistrationLinkController::class, 'index']);
            Route::post('/registration-links', [AdminRegistrationLinkController::class, 'store']);
            Route::get('/registration-links/{registrationLink}', [AdminRegistrationLinkController::class, 'show'])->whereNumber('registrationLink');
            Route::put('/registration-links/{registrationLink}', [AdminRegistrationLinkController::class, 'update'])->whereNumber('registrationLink');
            Route::patch('/registration-links/{registrationLink}/toggle', [AdminRegistrationLinkController::class, 'toggle'])->whereNumber('registrationLink');
            Route::get('/reference-data', [AdminReferenceDataController::class, 'index']);
            Route::post('/reference-data/department-templates', [AdminReferenceDataController::class, 'storeDepartmentTemplate']);
            Route::put('/reference-data/department-templates/{departmentTemplate}', [AdminReferenceDataController::class, 'updateDepartmentTemplate'])
                ->whereNumber('departmentTemplate');
            Route::delete('/reference-data/department-templates/{departmentTemplate}', [AdminReferenceDataController::class, 'destroyDepartmentTemplate'])
                ->whereNumber('departmentTemplate');
            Route::post('/reference-data/faculty-roles', [AdminReferenceDataController::class, 'storeFacultyRole']);
            Route::put('/reference-data/faculty-roles/{facultyRole}', [AdminReferenceDataController::class, 'updateFacultyRole'])
                ->whereNumber('facultyRole');
            Route::delete('/reference-data/faculty-roles/{facultyRole}', [AdminReferenceDataController::class, 'destroyFacultyRole'])
                ->whereNumber('facultyRole');
        });
});
