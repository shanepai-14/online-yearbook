<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Reaction extends Model
{
    use HasFactory;

    public const TYPE_STUDENT = 'student';
    public const TYPE_FACULTY = 'faculty';

    protected $fillable = [
        'target_type',
        'target_id',
        'visitor_key',
    ];

    public static function allowedTypes(): array
    {
        return [
            self::TYPE_STUDENT,
            self::TYPE_FACULTY,
        ];
    }

    public function scopeForTarget(Builder $query, string $targetType, int $targetId): Builder
    {
        return $query
            ->where('target_type', $targetType)
            ->where('target_id', $targetId);
    }
}
