<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Laravel\Facades\Image;

class ImageOptimizer
{
    /**
     * Compress and store an uploaded image as WebP on the public disk.
     *
     * Returns the storage-relative path (e.g. "student-photos/abc123.webp").
     */
    public static function storeAsWebP(UploadedFile $file, string $directory, int $quality = 82): string
    {
        $filename = Str::random(40) . '.webp';
        $path = $directory . '/' . $filename;

        $encoded = Image::read($file)->toWebp($quality)->toString();

        Storage::disk('public')->put($path, $encoded);

        return $path;
    }
}
