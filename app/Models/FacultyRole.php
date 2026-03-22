<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FacultyRole extends Model
{
    protected $fillable = [
        'name',
    ];

    public function faculty(): HasMany
    {
        return $this->hasMany(Faculty::class);
    }
}
