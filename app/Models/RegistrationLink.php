<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RegistrationLink extends Model
{
    use HasFactory;

    public const TYPE_FREE_YEAR_FREE_DEPARTMENT = 'free_year_free_department';
    public const TYPE_FIXED_YEAR_SELECT_DEPARTMENT = 'fixed_year_select_department';
    public const TYPE_FIXED_DEPARTMENT_SELECT_YEAR = 'fixed_department_select_year';
    public const TYPE_FIXED_YEAR_FIXED_DEPARTMENT = 'fixed_year_fixed_department';

    protected $fillable = [
        'title',
        'token',
        'type',
        'yearbook_id',
        'department_id',
        'starts_at',
        'ends_at',
        'is_active',
        'description',
        'created_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
    ];

    public static function allowedTypes(): array
    {
        return [
            self::TYPE_FREE_YEAR_FREE_DEPARTMENT,
            self::TYPE_FIXED_YEAR_SELECT_DEPARTMENT,
            self::TYPE_FIXED_DEPARTMENT_SELECT_YEAR,
            self::TYPE_FIXED_YEAR_FIXED_DEPARTMENT,
        ];
    }

    public static function typeLabel(string $type): string
    {
        return match ($type) {
            self::TYPE_FREE_YEAR_FREE_DEPARTMENT => 'Free Department + Free Year',
            self::TYPE_FIXED_YEAR_SELECT_DEPARTMENT => 'Fixed Year + Select Department',
            self::TYPE_FIXED_DEPARTMENT_SELECT_YEAR => 'Fixed Department + Select Year',
            self::TYPE_FIXED_YEAR_FIXED_DEPARTMENT => 'Fixed Department + Fixed Year',
            default => $type,
        };
    }

    public function yearbook(): BelongsTo
    {
        return $this->belongsTo(Yearbook::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
    }

    public function isWithinSchedule(?CarbonInterface $now = null): bool
    {
        $now = $now ?? now();

        if ($this->starts_at && $now->lt($this->starts_at)) {
            return false;
        }

        if ($this->ends_at && $now->gt($this->ends_at)) {
            return false;
        }

        return true;
    }

    public function isCurrentlyAvailable(?CarbonInterface $now = null): bool
    {
        return $this->is_active && $this->isWithinSchedule($now);
    }

    public function availabilityState(?CarbonInterface $now = null): string
    {
        $now = $now ?? now();

        if (! $this->is_active) {
            return 'inactive';
        }

        if ($this->starts_at && $now->lt($this->starts_at)) {
            return 'not_started';
        }

        if ($this->ends_at && $now->gt($this->ends_at)) {
            return 'expired';
        }

        return 'active';
    }

    public function availabilityMessage(?CarbonInterface $now = null): string
    {
        return match ($this->availabilityState($now)) {
            'inactive' => 'This registration link is not active.',
            'not_started' => 'This registration period has not started yet.',
            'expired' => 'This registration period has expired.',
            default => 'Registration is open.',
        };
    }
}
