<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Yearbook extends Model
{
    use HasFactory;

    protected $fillable = [
        'graduating_year',
        'academic_year_text',
        'hero_title',
        'hero_description',
    ];

    public function departments(): HasMany
    {
        return $this->hasMany(Department::class);
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
    }

    public function registrationLinks(): HasMany
    {
        return $this->hasMany(RegistrationLink::class);
    }
}
