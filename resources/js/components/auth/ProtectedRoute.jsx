import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '@/hooks/useAuth';

export default function ProtectedRoute({ children, redirectTo = '/yearbook/login' }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
                Loading...
            </div>
        );
    }

    if (!user) {
        return <Navigate to={redirectTo} replace state={{ from: location }} />;
    }

    return children ?? <Outlet />;
}
