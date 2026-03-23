<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'registration_link_id',
        'department_id',
        'yearbook_id',
        'name',
        'gender',
        'photo',
        'motto',
        'badge',
        'is_profile_completed',
    ];

    protected $casts = [
        'is_profile_completed' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function registrationLink(): BelongsTo
    {
        return $this->belongsTo(RegistrationLink::class);
    }

    public function yearbook(): BelongsTo
    {
        return $this->belongsTo(Yearbook::class);
    }
}
