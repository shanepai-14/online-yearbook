import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import AdminLayout from '@/layouts/AdminLayout';
import MainLayout from '@/layouts/MainLayout';
import StudentLayout from '@/layouts/StudentLayout';
import AdminDashboardPage from '@/pages/AdminDashboardPage';
import AdminStudentsPage from '@/pages/AdminStudentsPage';
import AdminYearbooksPage from '@/pages/AdminYearbooksPage';
import GraduatesYearPage from '@/pages/GraduatesYearPage';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import NotFoundPage from '@/pages/NotFoundPage';
import StudentDashboardPage from '@/pages/StudentDashboardPage';
import StudentProfilePage from '@/pages/StudentProfilePage';
import UnauthorizedPage from '@/pages/UnauthorizedPage';
import { AdminAccessRoute, GuestOnlyRoute, StudentAccessRoute } from '@/router/guards';

export function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<MainLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/graduates/:year" element={<GraduatesYearPage />} />

                    <Route element={<GuestOnlyRoute />}>
                        <Route path="/login" element={<LoginPage />} />
                    </Route>

                    <Route path="/unauthorized" element={<UnauthorizedPage />} />
                </Route>

                <Route element={<StudentAccessRoute />}>
                    <Route element={<StudentLayout />}>
                        <Route path="/student" element={<StudentDashboardPage />} />
                        <Route path="/student/profile" element={<StudentProfilePage />} />
                    </Route>
                </Route>

                <Route element={<AdminAccessRoute />}>
                    <Route element={<AdminLayout />}>
                        <Route path="/admin" element={<AdminDashboardPage />} />
                        <Route path="/admin/yearbooks" element={<AdminYearbooksPage />} />
                        <Route path="/admin/students" element={<AdminStudentsPage />} />
                    </Route>
                </Route>

                <Route path="/graduates" element={<Navigate to="/graduates/2025" replace />} />
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    );
}
