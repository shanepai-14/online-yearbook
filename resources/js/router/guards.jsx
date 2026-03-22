import { Navigate, Outlet } from 'react-router-dom';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import RoleGate from '@/components/auth/RoleGate';
import { useAuth } from '@/hooks/useAuth';

function dashboardPathForRole(role) {
    if (role === 'admin') {
        return '/admin';
    }

    if (role === 'student') {
        return '/student';
    }

    return '/';
}

export function GuestOnlyRoute() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
                Loading...
            </div>
        );
    }

    if (user) {
        return <Navigate to={dashboardPathForRole(user.role)} replace />;
    }

    return <Outlet />;
}

export function StudentAccessRoute() {
    return (
        <ProtectedRoute>
            <RoleGate allow={['student', 'admin']}>
                <Outlet />
            </RoleGate>
        </ProtectedRoute>
    );
}

export function AdminAccessRoute() {
    return (
        <ProtectedRoute>
            <RoleGate allow={['admin']}>
                <Outlet />
            </RoleGate>
        </ProtectedRoute>
    );
}
