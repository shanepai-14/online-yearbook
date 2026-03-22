<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DepartmentTemplate extends Model
{
    protected $fillable = [
        'label',
        'full_name',
        'description',
    ];

    public function departments(): HasMany
    {
        return $this->hasMany(Department::class);
    }
}
