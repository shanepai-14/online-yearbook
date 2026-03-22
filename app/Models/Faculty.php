<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Faculty extends Model
{
    use HasFactory;

    protected $table = 'faculty';

    protected $fillable = [
        'department_id',
        'faculty_role_id',
        'name',
        'role',
        'photo',
    ];

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function facultyRole(): BelongsTo
    {
        return $this->belongsTo(FacultyRole::class);
    }
}
