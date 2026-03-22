<?php

namespace App\Support;

use Illuminate\Support\Str;

class StudentPhotoMedia
{
    public const DIRECTORY = 'student-photos';

    public static function normalizePublicUrl(?string $photo): ?string
    {
        if (! is_string($photo)) {
            return $photo;
        }

        $trimmedPhoto = trim($photo);

        if ($trimmedPhoto === '') {
            return $photo;
        }

        $storagePath = self::storagePathFromValue($trimmedPhoto);

        if (! $storagePath) {
            return $photo;
        }

        return self::publicUrlForStoragePath($storagePath);
    }

    public static function storagePathFromValue(?string $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $trimmedValue = trim($value);

        if ($trimmedValue === '') {
            return null;
        }

        if (self::isManagedStoragePath($trimmedValue)) {
            return $trimmedValue;
        }

        $parsedPath = parse_url($trimmedValue, PHP_URL_PATH);

        if (! is_string($parsedPath) || $parsedPath === '') {
            return null;
        }

        $normalizedPath = urldecode($parsedPath);

        foreach (['/media/'.self::DIRECTORY.'/', '/storage/'.self::DIRECTORY.'/'] as $marker) {
            $position = strpos($normalizedPath, $marker);

            if ($position === false) {
                continue;
            }

            $relativePath = substr($normalizedPath, $position + strlen($marker));
            $relativePath = ltrim($relativePath, '/');

            if (! self::isSafeRelativePath($relativePath)) {
                return null;
            }

            return self::DIRECTORY.'/'.$relativePath;
        }

        return null;
    }

    public static function publicUrlForStoragePath(string $storagePath): string
    {
        $filename = basename($storagePath);

        return route('media.student-photo', ['filename' => $filename]);
    }

    public static function isSafeFilename(string $filename): bool
    {
        return (bool) preg_match('/^[A-Za-z0-9][A-Za-z0-9._-]*$/', $filename);
    }

    private static function isManagedStoragePath(string $path): bool
    {
        return str_starts_with($path, self::DIRECTORY.'/') && self::isSafeRelativePath(Str::after($path, self::DIRECTORY.'/'));
    }

    private static function isSafeRelativePath(string $path): bool
    {
        if ($path === '' || str_contains($path, '..')) {
            return false;
        }

        return (bool) preg_match('/^[A-Za-z0-9._\\/-]+$/', $path);
    }
}
