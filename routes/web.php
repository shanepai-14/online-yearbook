<?php

use App\Http\Controllers\StudentPhotoController;
use Illuminate\Support\Facades\Route;

Route::get('/media/student-photos/{filename}', [StudentPhotoController::class, 'show'])
    ->where('filename', '[A-Za-z0-9._-]+')
    ->name('media.student-photo');

Route::view('/{path?}', 'app')->where('path', '^(?!api).*$');
