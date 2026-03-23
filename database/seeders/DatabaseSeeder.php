<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\DepartmentGroupPhoto;
use App\Models\DepartmentTemplate;
use App\Models\Faculty;
use App\Models\FacultyRole;
use App\Models\Reaction;
use App\Models\RegistrationLink;
use App\Models\SchoolSetting;
use App\Models\Student;
use App\Models\User;
use App\Models\Yearbook;
use App\Models\YearbookComment;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        YearbookComment::query()->delete();
        Reaction::query()->delete();
        Student::query()->delete();
        RegistrationLink::query()->delete();
        Faculty::query()->delete();
        FacultyRole::query()->delete();
        DepartmentGroupPhoto::query()->delete();
        Department::query()->delete();
        DepartmentTemplate::query()->delete();
        Yearbook::query()->delete();
        SchoolSetting::query()->delete();
        User::query()
            ->whereIn('email', ['admin@yearbook.test', 'student@yearbook.test'])
            ->delete();

        SchoolSetting::query()->create([
            'school_name' => 'Davao Vision Colleges',
            'graduates_content_alignment' => SchoolSetting::ALIGN_CENTER,
        ]);

        $yearbook2023 = Yearbook::query()->create([
            'graduating_year' => 2023,
            'academic_year_text' => 'Academic Year 2022 - 2023',
            'hero_title' => 'Celebrating the Class of 2023',
            'hero_description' => 'A milestone year of growth, resilience, and shared achievement.',
        ]);

        $templateBsit = DepartmentTemplate::query()->create([
            'label' => 'BSIT',
            'full_name' => 'Bachelor of Science in Information Technology',
            'description' => 'Preparing future professionals in software development, systems, networking, and data.',
        ]);

        $facultyRoleProgramChair = FacultyRole::query()->create([
            'name' => 'Program Chair',
        ]);

        $bsit = Department::query()->create([
            'yearbook_id' => $yearbook2023->id,
            'department_template_id' => $templateBsit->id,
            'group_photo' => null,
        ]);

        Faculty::query()->create([
            'department_id' => $bsit->id,
            'faculty_role_id' => $facultyRoleProgramChair->id,
            'name' => 'Dr. Maria Santos',
            'role' => $facultyRoleProgramChair->name,
            'photo' => null,
        ]);

        $adminUser = User::query()->create([
            'name' => 'Admin User',
            'email' => 'admin@yearbook.test',
            'password' => 'password123',
            'role' => User::ROLE_ADMIN,
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        RegistrationLink::query()->create([
            'title' => 'BSIT Class of 2023 Registration',
            'token' => 'bsit-2023',
            'type' => RegistrationLink::TYPE_FIXED_YEAR_FIXED_DEPARTMENT,
            'yearbook_id' => $yearbook2023->id,
            'department_id' => $bsit->id,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addDays(60),
            'is_active' => true,
            'description' => 'Registration is fixed to BSIT, Class of 2023.',
            'created_by' => $adminUser?->id,
        ]);

        $studentUser = User::query()->create([
            'name' => 'Student User',
            'email' => 'student@yearbook.test',
            'password' => 'password123',
            'role' => User::ROLE_STUDENT,
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        $studentProfile = Student::query()->create([
            'user_id' => $studentUser->id,
            'department_id' => $bsit->id,
            'yearbook_id' => $yearbook2023->id,
            'name' => 'Student User',
            'gender' => 'male',
            'photo' => null,
            'motto' => 'Build with purpose.',
            'badge' => 'Honor Student',
            'is_profile_completed' => true,
        ]);

        $visitorA = hash('sha256', '127.0.0.1|Seeder-Agent-A');

        Reaction::query()->create([
            'target_type' => Reaction::TYPE_STUDENT,
            'target_id' => $studentProfile->id,
            'visitor_key' => $visitorA,
        ]);

        YearbookComment::query()->create([
            'target_type' => Reaction::TYPE_STUDENT,
            'target_id' => $studentProfile->id,
            'name' => 'Anonymous',
            'message' => 'Congratulations on your graduation!',
            'visitor_key' => $visitorA,
        ]);
    }
}
