<?php

use App\Http\Controllers\DepartmentGroupPhotoController;
use App\Http\Controllers\FacultyPhotoController;
use App\Http\Controllers\StudentPhotoController;
use Illuminate\Support\Facades\Route;

Route::get('/media/student-photos/{filename}', [StudentPhotoController::class, 'show'])
    ->where('filename', '[A-Za-z0-9._-]+')
    ->name('media.student-photo');

Route::get('/media/department-group-photos/{filename}', [DepartmentGroupPhotoController::class, 'show'])
    ->where('filename', '[A-Za-z0-9._-]+')
    ->name('media.department-group-photo');

Route::get('/media/faculty-photos/{filename}', [FacultyPhotoController::class, 'show'])
    ->where('filename', '[A-Za-z0-9._-]+')
    ->name('media.faculty-photo');

Route::view('/{path?}', 'app')->where('path', '^(?!api).*$');
