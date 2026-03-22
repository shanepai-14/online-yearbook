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
        Student::query()->delete();
        RegistrationLink::query()->delete();
        Faculty::query()->delete();
        FacultyRole::query()->delete();
        DepartmentGroupPhoto::query()->delete();
        Department::query()->delete();
        DepartmentTemplate::query()->delete();
        Yearbook::query()->delete();
        Reaction::query()->delete();
        YearbookComment::query()->delete();
        SchoolSetting::query()->delete();
        User::query()
            ->whereIn('email', ['admin@yearbook.test', 'student@yearbook.test'])
            ->delete();

        SchoolSetting::query()->create([
            'school_name' => 'Davao Vision Colleges',
            'graduates_content_alignment' => SchoolSetting::ALIGN_LEFT,
        ]);

        $yearbook2025 = Yearbook::query()->create([
            'graduating_year' => 2025,
            'academic_year_text' => 'Academic Year 2024 - 2025',
            'hero_title' => 'Celebrating the Class of 2025',
            'hero_description' => 'A milestone year of growth, resilience, and shared achievement.',
        ]);

        $yearbook2024 = Yearbook::query()->create([
            'graduating_year' => 2024,
            'academic_year_text' => 'Academic Year 2023 - 2024',
            'hero_title' => 'Celebrating the Class of 2024',
            'hero_description' => 'Building bridges, creating futures.',
        ]);

        $templateBscs = DepartmentTemplate::query()->create([
            'label' => 'BSCS',
            'full_name' => 'Bachelor of Science in Computer Science',
            'description' => 'Focused on software engineering, systems, and intelligent applications.',
        ]);

        $templateBsba = DepartmentTemplate::query()->create([
            'label' => 'BSBA',
            'full_name' => 'Bachelor of Science in Business Administration',
            'description' => 'Built around strategic thinking, leadership, and entrepreneurship.',
        ]);

        $templateBeed = DepartmentTemplate::query()->create([
            'label' => 'BEED',
            'full_name' => 'Bachelor of Elementary Education',
            'description' => 'Prepared future educators for learner-centered and inclusive classrooms.',
        ]);

        $facultyRoleProgramChair = FacultyRole::query()->create([
            'name' => 'Program Chair',
        ]);

        $facultyRoleSeniorLecturer = FacultyRole::query()->create([
            'name' => 'Senior Lecturer',
        ]);

        $facultyRoleDean = FacultyRole::query()->create([
            'name' => 'Dean',
        ]);

        $cs = Department::query()->create([
            'yearbook_id' => $yearbook2025->id,
            'department_template_id' => $templateBscs->id,
            'group_photo' => 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
        ]);

        $bsba = Department::query()->create([
            'yearbook_id' => $yearbook2025->id,
            'department_template_id' => $templateBsba->id,
            'group_photo' => 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
        ]);

        $beed = Department::query()->create([
            'yearbook_id' => $yearbook2025->id,
            'department_template_id' => $templateBeed->id,
            'group_photo' => 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80',
        ]);

        Department::query()->create([
            'yearbook_id' => $yearbook2024->id,
            'department_template_id' => $templateBscs->id,
        ]);
        Department::query()->create([
            'yearbook_id' => $yearbook2024->id,
            'department_template_id' => $templateBsba->id,
        ]);
        Department::query()->create([
            'yearbook_id' => $yearbook2024->id,
            'department_template_id' => $templateBeed->id,
        ]);

        DepartmentGroupPhoto::query()->create([
            'department_id' => $cs->id,
            'photo' => 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
            'sort_order' => 1,
        ]);
        DepartmentGroupPhoto::query()->create([
            'department_id' => $cs->id,
            'photo' => 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
            'sort_order' => 2,
        ]);
        DepartmentGroupPhoto::query()->create([
            'department_id' => $bsba->id,
            'photo' => 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
            'sort_order' => 1,
        ]);
        DepartmentGroupPhoto::query()->create([
            'department_id' => $bsba->id,
            'photo' => 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
            'sort_order' => 2,
        ]);

        $csFaculty = Faculty::query()->create([
            'department_id' => $cs->id,
            'faculty_role_id' => $facultyRoleProgramChair->id,
            'name' => 'Dr. Maria Santos',
            'role' => $facultyRoleProgramChair->name,
            'photo' => 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
        ]);
        Faculty::query()->create([
            'department_id' => $bsba->id,
            'faculty_role_id' => $facultyRoleSeniorLecturer->id,
            'name' => 'Prof. Daniel Cruz',
            'role' => $facultyRoleSeniorLecturer->name,
            'photo' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        ]);
        $beedFaculty = Faculty::query()->create([
            'department_id' => $beed->id,
            'faculty_role_id' => $facultyRoleDean->id,
            'name' => 'Dr. Angela Reyes',
            'role' => $facultyRoleDean->name,
            'photo' => 'https://images.unsplash.com/photo-1551836022-4c4c79ecde51?auto=format&fit=crop&w=300&q=80',
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
            'title' => 'Open Registration (All Years and Departments)',
            'token' => 'free-all-years-and-departments',
            'type' => RegistrationLink::TYPE_FREE_YEAR_FREE_DEPARTMENT,
            'yearbook_id' => null,
            'department_id' => null,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addDays(60),
            'is_active' => true,
            'description' => 'Students can choose both department and graduating year.',
            'created_by' => $adminUser?->id,
        ]);

        RegistrationLink::query()->create([
            'title' => 'Class of 2025 Registration',
            'token' => 'fixed-2025-select-department',
            'type' => RegistrationLink::TYPE_FIXED_YEAR_SELECT_DEPARTMENT,
            'yearbook_id' => $yearbook2025->id,
            'department_id' => null,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addDays(45),
            'is_active' => true,
            'description' => 'Year is fixed to 2025 while department remains selectable.',
            'created_by' => $adminUser?->id,
        ]);

        RegistrationLink::query()->create([
            'title' => 'BSCS Program Registration',
            'token' => 'fixed-bscs-select-year',
            'type' => RegistrationLink::TYPE_FIXED_DEPARTMENT_SELECT_YEAR,
            'yearbook_id' => null,
            'department_id' => $cs->id,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addDays(45),
            'is_active' => true,
            'description' => 'Department is fixed to BSCS while year remains selectable.',
            'created_by' => $adminUser?->id,
        ]);

        RegistrationLink::query()->create([
            'title' => 'BSBA Class of 2025 Exclusive Registration',
            'token' => 'fixed-bsba-2025',
            'type' => RegistrationLink::TYPE_FIXED_YEAR_FIXED_DEPARTMENT,
            'yearbook_id' => $yearbook2025->id,
            'department_id' => $bsba->id,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addDays(30),
            'is_active' => true,
            'description' => 'Both year and department are pre-assigned by link.',
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
            'department_id' => $cs->id,
            'yearbook_id' => $yearbook2025->id,
            'name' => 'Student User',
            'photo' => 'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=300&q=80',
            'motto' => 'Build with purpose.',
            'badge' => 'Honor Student',
            'is_profile_completed' => true,
        ]);

        $arianne = Student::query()->create([
            'department_id' => $cs->id,
            'yearbook_id' => $yearbook2025->id,
            'name' => 'Arianne Dela Cruz',
            'photo' => 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=300&q=80',
            'motto' => 'Code. Learn. Repeat.',
            'badge' => 'Dean\'s Lister',
            'is_profile_completed' => true,
        ]);

        Student::query()->create([
            'department_id' => $bsba->id,
            'yearbook_id' => $yearbook2025->id,
            'name' => 'John Michael Yu',
            'photo' => 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
            'motto' => 'Lead with integrity.',
            'badge' => 'Student Leader',
            'is_profile_completed' => true,
        ]);

        Student::query()->create([
            'department_id' => $beed->id,
            'yearbook_id' => $yearbook2025->id,
            'name' => 'Liza Mae Ramos',
            'photo' => null,
            'motto' => null,
            'badge' => null,
            'is_profile_completed' => false,
        ]);

        $visitorA = hash('sha256', '127.0.0.1|Seeder-Agent-A');
        $visitorB = hash('sha256', '127.0.0.1|Seeder-Agent-B');

        Reaction::query()->create([
            'target_type' => Reaction::TYPE_STUDENT,
            'target_id' => $studentProfile->id,
            'visitor_key' => $visitorA,
        ]);
        Reaction::query()->create([
            'target_type' => Reaction::TYPE_STUDENT,
            'target_id' => $arianne->id,
            'visitor_key' => $visitorA,
        ]);
        Reaction::query()->create([
            'target_type' => Reaction::TYPE_STUDENT,
            'target_id' => $arianne->id,
            'visitor_key' => $visitorB,
        ]);
        Reaction::query()->create([
            'target_type' => Reaction::TYPE_FACULTY,
            'target_id' => $csFaculty->id,
            'visitor_key' => $visitorA,
        ]);
        Reaction::query()->create([
            'target_type' => Reaction::TYPE_FACULTY,
            'target_id' => $beedFaculty->id,
            'visitor_key' => $visitorB,
        ]);

        YearbookComment::query()->create([
            'target_type' => Reaction::TYPE_STUDENT,
            'target_id' => $studentProfile->id,
            'name' => 'Anonymous',
            'message' => 'Congratulations on your graduation!',
            'visitor_key' => $visitorA,
        ]);
        YearbookComment::query()->create([
            'target_type' => Reaction::TYPE_STUDENT,
            'target_id' => $arianne->id,
            'name' => 'Batchmate',
            'message' => 'Proud of you and your journey!',
            'visitor_key' => $visitorB,
        ]);
        YearbookComment::query()->create([
            'target_type' => Reaction::TYPE_FACULTY,
            'target_id' => $csFaculty->id,
            'name' => 'Anonymous',
            'message' => 'Thank you for your guidance all these years.',
            'visitor_key' => $visitorA,
        ]);
    }
}
