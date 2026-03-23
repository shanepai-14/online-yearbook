import { Outlet, useNavigate } from 'react-router-dom';

import PortalTopbar from '@/components/layout/PortalTopbar';
import SidebarNav from '@/components/layout/SidebarNav';
import { useAuth } from '@/hooks/useAuth';

const links = [
    { to: '/student', label: 'Dashboard', end: true },
    { to: '/student/profile', label: 'Profile' },
];

export default function StudentLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/yearbook/login', { replace: true });
    };

    return (
        <div className="min-h-screen bg-slate-100">
            <PortalTopbar
                title="Student Dashboard"
                subtitle="Manage your yearbook profile"
                userName={user?.name}
                onLogout={handleLogout}
            />

            <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
                <SidebarNav links={links} orientation="horizontal" className="mb-6" />
                <main>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
