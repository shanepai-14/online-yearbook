import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import AdminLayout from '@/layouts/AdminLayout';
import MainLayout from '@/layouts/MainLayout';
import StudentLayout from '@/layouts/StudentLayout';
import AdminDashboardPage from '@/pages/AdminDashboardPage';
import AdminRegistrationLinkFormPage from '@/pages/AdminRegistrationLinkFormPage';
import AdminRegistrationLinksPage from '@/pages/AdminRegistrationLinksPage';
import AdminStudentsPage from '@/pages/AdminStudentsPage';
import AdminYearbooksPage from '@/pages/AdminYearbooksPage';
import GraduatesYearPage from '@/pages/GraduatesYearPage';
import GuestCardMakerPage from '@/pages/GuestCardMakerPage';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import NotFoundPage from '@/pages/NotFoundPage';
import RegisterByLinkPage from '@/pages/RegisterByLinkPage';
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
                    <Route path="/fun-card" element={<GuestCardMakerPage />} />
                    <Route path="/graduates/:year" element={<GraduatesYearPage />} />
                    <Route path="/register/:token" element={<RegisterByLinkPage />} />

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
                        <Route path="/admin/registration-links" element={<AdminRegistrationLinksPage />} />
                        <Route path="/admin/registration-links/create" element={<AdminRegistrationLinkFormPage />} />
                        <Route path="/admin/registration-links/:id" element={<AdminRegistrationLinkFormPage />} />
                    </Route>
                </Route>

                <Route path="/graduates" element={<Navigate to="/graduates/2025" replace />} />
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    );
}
