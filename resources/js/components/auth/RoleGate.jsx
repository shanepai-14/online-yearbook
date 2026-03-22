import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '@/hooks/useAuth';

export default function RoleGate({ allow = [], children, redirectTo = '/unauthorized' }) {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allow.length > 0 && !allow.includes(user.role)) {
        return <Navigate to={redirectTo} replace />;
    }

    return children ?? <Outlet />;
}
