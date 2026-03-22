<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class YearbookComment extends Model
{
    use HasFactory;

    protected $table = 'yearbook_comments';

    protected $fillable = [
        'target_type',
        'target_id',
        'name',
        'message',
        'visitor_key',
    ];

    public static function allowedTypes(): array
    {
        return [
            Reaction::TYPE_STUDENT,
            Reaction::TYPE_FACULTY,
        ];
    }
}
