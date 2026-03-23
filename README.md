# Online Yearbook Portal

Laravel + React SPA for a school yearbook system with public browsing, student self-service, and admin management.

## Stack

- Backend: Laravel 13 (PHP 8.3+)
- Frontend: React 18 + React Router (SPA)
- Build tool: Vite
- Styling: Tailwind CSS + shadcn/ui primitives
- Database: MySQL (or compatible)

## Core Features

- Public yearbook archive under `/yearbook`
- Year-based graduates page: `/yearbook/:year` (example: `/yearbook/2023`)
- Student and faculty interactive cards (modal view, reactions, comments, share, download)
- Student dashboard/profile editing
- Admin dashboard with yearbook and student management
- Admin registration link management (`/yearbook/register/:token`)
- Guest fun card maker (`/yearbook/fun-card`)

## Routing

### Public SPA Routes

- `/yearbook`
- `/yearbook/:year`
- `/yearbook/login`
- `/yearbook/register/:token`
- `/yearbook/fun-card`

### Legacy Redirects

- `/` -> `/yearbook`
- `/graduates/:year` -> `/yearbook/:year`
- `/login` -> `/yearbook/login`
- `/register/:token` -> `/yearbook/register/:token`
- `/fun-card` -> `/yearbook/fun-card`

### Protected SPA Routes

- Student:
  - `/student`
  - `/student/profile`
- Admin:
  - `/admin`
  - `/admin/yearbooks`
  - `/admin/students`
  - `/admin/registration-links`

## API Overview (`/api`)

### Auth

- `POST /api/login`
- `POST /api/logout`
- `GET /api/me`

### Public

- `GET /api/school-setting`
- `GET /api/yearbooks`
- `GET /api/yearbooks/{year}`
- `GET /api/reactions/{type}/{targetId}`
- `POST /api/reactions/toggle`
- `GET /api/comments/{type}/{targetId}`
- `POST /api/comments`
- `GET /api/registration-links/{token}`
- `POST /api/register/{token}`

### Student

- `GET /api/student/profile`
- `POST /api/student/profile`
- `PUT /api/student/profile`
- `POST /api/student/profile/department-group-photos`
- `PATCH /api/student/profile/department-group-photos/reorder`
- `DELETE /api/student/profile/department-group-photos/{departmentGroupPhoto}`

### Admin

- `GET /api/admin/students`
- `PUT /api/admin/students/{student}`
- `PATCH /api/admin/students/{student}/status`
- `GET /api/admin/yearbooks`
- `POST /api/admin/yearbooks`
- `PUT /api/admin/yearbooks/{yearbook}`
- `DELETE /api/admin/yearbooks/{yearbook}`
- `POST /api/admin/yearbooks/{yearbook}/departments`
- `PUT /api/admin/yearbooks/{yearbook}/departments/{department}`
- `DELETE /api/admin/yearbooks/{yearbook}/departments/{department}`
- `POST /api/admin/departments/{department}/faculty`
- `PUT /api/admin/departments/{department}/faculty/{faculty}`
- `DELETE /api/admin/departments/{department}/faculty/{faculty}`
- `POST /api/admin/departments/{department}/group-photos`
- `PATCH /api/admin/departments/{department}/group-photos/reorder`
- `DELETE /api/admin/departments/{department}/group-photos/{departmentGroupPhoto}`
- `GET /api/admin/school-setting`
- `PUT /api/admin/school-setting`
- `GET /api/admin/registration-links`
- `POST /api/admin/registration-links`
- `GET /api/admin/registration-links/{registrationLink}`
- `PUT /api/admin/registration-links/{registrationLink}`
- `PATCH /api/admin/registration-links/{registrationLink}/toggle`
- `GET /api/admin/reference-data`
- `POST /api/admin/reference-data/department-templates`
- `PUT /api/admin/reference-data/department-templates/{departmentTemplate}`
- `DELETE /api/admin/reference-data/department-templates/{departmentTemplate}`
- `POST /api/admin/reference-data/faculty-roles`
- `PUT /api/admin/reference-data/faculty-roles/{facultyRole}`
- `DELETE /api/admin/reference-data/faculty-roles/{facultyRole}`

## Local Setup

1. Install dependencies

```bash
composer install
npm install
```

2. Environment

```bash
cp .env.example .env
php artisan key:generate
```

3. Configure database in `.env`, then run migrations + seeders

```bash
php artisan migrate
php artisan db:seed
```

4. Create storage symlink for uploads

```bash
php artisan storage:link
```

5. Run in development

```bash
composer run dev
```

or run separately:

```bash
php artisan serve
npm run dev
```

## Build for Production

```bash
npm run build
php artisan optimize
```

## Seeded Accounts

From the current `DatabaseSeeder`:

- Admin
  - Email: `admin@yearbook.test`
  - Password: `password123`
- Student
  - Email: `student@yearbook.test`
  - Password: `password123`

## Seeded Demo Data (Current)

- 1 yearbook: class of **2023**
- 1 department: **BSIT**
- 1 faculty record
- 1 student profile linked to `student@yearbook.test`

## Media and Uploads

- Media is served through:
  - `/media/student-photos/{filename}`
  - `/media/faculty-photos/{filename}`
  - `/media/department-group-photos/{filename}`
- Application validation currently allows image uploads up to **15MB per file**.

Important: server limits must also allow this size (`upload_max_filesize`, `post_max_size`).

## Deployment Notes

- Set `APP_ENV=production`, `APP_DEBUG=false`, and correct `APP_URL`.
- Run `composer install --no-dev --optimize-autoloader`.
- Build frontend assets with `npm ci && npm run build`.
- Cache config/routes/views:

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## License

This project is private/internal unless otherwise specified by the repository owner.
