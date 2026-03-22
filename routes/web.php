<?php

use App\Http\Controllers\DepartmentGroupPhotoController;
use App\Http\Controllers\StudentPhotoController;
use Illuminate\Support\Facades\Route;

Route::get('/media/student-photos/{filename}', [StudentPhotoController::class, 'show'])
    ->where('filename', '[A-Za-z0-9._-]+')
    ->name('media.student-photo');

Route::get('/media/department-group-photos/{filename}', [DepartmentGroupPhotoController::class, 'show'])
    ->where('filename', '[A-Za-z0-9._-]+')
    ->name('media.department-group-photo');

Route::view('/{path?}', 'app')->where('path', '^(?!api).*$');
