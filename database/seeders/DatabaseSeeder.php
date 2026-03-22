<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Faculty;
use App\Models\Reaction;
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
        Faculty::query()->delete();
        Department::query()->delete();
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

        $cs = Department::query()->create([
            'yearbook_id' => $yearbook2025->id,
            'label' => 'BSCS',
            'full_name' => 'Bachelor of Science in Computer Science',
            'description' => 'Focused on software engineering, systems, and intelligent applications.',
        ]);

        $bsba = Department::query()->create([
            'yearbook_id' => $yearbook2025->id,
            'label' => 'BSBA',
            'full_name' => 'Bachelor of Science in Business Administration',
            'description' => 'Built around strategic thinking, leadership, and entrepreneurship.',
        ]);

        $beed = Department::query()->create([
            'yearbook_id' => $yearbook2025->id,
            'label' => 'BEED',
            'full_name' => 'Bachelor of Elementary Education',
            'description' => 'Prepared future educators for learner-centered and inclusive classrooms.',
        ]);

        $csFaculty = Faculty::query()->create([
            'department_id' => $cs->id,
            'name' => 'Dr. Maria Santos',
            'role' => 'Program Chair',
            'photo' => 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
        ]);
        Faculty::query()->create([
            'department_id' => $bsba->id,
            'name' => 'Prof. Daniel Cruz',
            'role' => 'Senior Lecturer',
            'photo' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        ]);
        $beedFaculty = Faculty::query()->create([
            'department_id' => $beed->id,
            'name' => 'Dr. Angela Reyes',
            'role' => 'Dean',
            'photo' => 'https://images.unsplash.com/photo-1551836022-4c4c79ecde51?auto=format&fit=crop&w=300&q=80',
        ]);

        User::query()->create([
            'name' => 'Admin User',
            'email' => 'admin@yearbook.test',
            'password' => 'password123',
            'role' => User::ROLE_ADMIN,
            'email_verified_at' => now(),
        ]);

        $studentUser = User::query()->create([
            'name' => 'Student User',
            'email' => 'student@yearbook.test',
            'password' => 'password123',
            'role' => User::ROLE_STUDENT,
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
