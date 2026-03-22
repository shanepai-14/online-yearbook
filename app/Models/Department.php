<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Department extends Model
{
    use HasFactory;

    protected $fillable = [
        'yearbook_id',
        'label',
        'full_name',
        'description',
        'group_photo',
    ];

    public function yearbook(): BelongsTo
    {
        return $this->belongsTo(Yearbook::class);
    }

    public function faculty(): HasMany
    {
        return $this->hasMany(Faculty::class);
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
    }

    public function groupPhotos(): HasMany
    {
        return $this->hasMany(DepartmentGroupPhoto::class)->orderBy('sort_order')->orderBy('id');
    }

    public function registrationLinks(): HasMany
    {
        return $this->hasMany(RegistrationLink::class);
    }
}
