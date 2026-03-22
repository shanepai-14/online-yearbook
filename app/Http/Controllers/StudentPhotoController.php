<?php

namespace App\Http\Controllers;

use App\Support\StudentPhotoMedia;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StudentPhotoController extends Controller
{
    public function show(string $filename): StreamedResponse|Response
    {
        if (! StudentPhotoMedia::isSafeFilename($filename)) {
            abort(404);
        }

        $storagePath = StudentPhotoMedia::DIRECTORY.'/'.$filename;

        if (! Storage::disk('public')->exists($storagePath)) {
            abort(404);
        }

        return Storage::disk('public')->response($storagePath, null, [
            'Cache-Control' => 'public, max-age=604800',
        ]);
    }
}
