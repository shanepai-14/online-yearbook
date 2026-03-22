<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SchoolSetting extends Model
{
    use HasFactory;

    public const ALIGN_LEFT = 'left';
    public const ALIGN_CENTER = 'center';
    public const ALIGN_RIGHT = 'right';

    protected $fillable = [
        'school_name',
        'graduates_content_alignment',
    ];

    public static function allowedAlignments(): array
    {
        return [
            self::ALIGN_LEFT,
            self::ALIGN_CENTER,
            self::ALIGN_RIGHT,
        ];
    }
}
