import { useEffect, useMemo, useState } from 'react';
import { BookOpenText, LayoutDashboard, Link as LinkIcon, LogOut, Menu, Users, X } from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '@/hooks/useAuth';
import { yearbookPalette as palette } from '@/lib/theme';
import { cn } from '@/lib/utils';

const links = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/yearbooks', label: 'Yearbooks', icon: BookOpenText },
    { to: '/admin/students', label: 'Students', icon: Users },
    { to: '/admin/registration-links', label: 'Registration Links', icon: LinkIcon },
];

function SidebarLinks() {
    return (
        <nav className="space-y-1">
            {links.map((link) => (
                <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) =>
                        cn(
                            'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                            isActive ? 'shadow-sm' : 'hover:bg-slate-100',
                        )
                    }
                    style={({ isActive }) => ({
                        color: isActive ? palette.navy : '#334155',
                        background: isActive ? `${palette.navy}14` : 'transparent',
                        borderLeft: isActive ? `3px solid ${palette.red}` : '3px solid transparent',
                    })}
                >
                    {({ isActive }) => (
                        <>
                            <link.icon className="h-4 w-4" style={{ color: isActive ? palette.navy : '#64748b' }} />
                            <span>{link.label}</span>
                        </>
                    )}
                </NavLink>
            ))}
        </nav>
    );
}

export default function AdminLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    const activeLabel = useMemo(() => {
        const matchedLink = links.find((link) =>
            link.end ? location.pathname === link.to : location.pathname.startsWith(link.to),
        );

        return matchedLink?.label ?? 'Dashboard';
    }, [location.pathname]);

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    return (
        <div className="min-h-screen" style={{ background: palette.lightBg, color: palette.navyDark }}>
            <aside
                className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r bg-white/95 px-4 py-6 shadow-xl backdrop-blur md:flex"
                style={{ borderColor: `${palette.cardBorder}cc` }}
            >
                <div className="px-3">
                    <p
                        className="text-[11px] uppercase tracking-[0.2em]"
                        style={{ fontFamily: "'Helvetica Neue', sans-serif", color: palette.red }}
                    >
                        Admin Portal
                    </p>
                    <h1 className="mt-2 text-xl font-semibold" style={{ color: palette.navy }}>
                        Yearbook Console
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">{user?.name || 'Administrator'}</p>
                </div>

                <div className="mt-6">
                    <SidebarLinks />
                </div>

                <div className="mt-auto px-3 pt-6">
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition"
                        style={{ background: palette.red }}
                        onMouseEnter={(event) => {
                            event.currentTarget.style.background = '#a53124';
                        }}
                        onMouseLeave={(event) => {
                            event.currentTarget.style.background = palette.red;
                        }}
                    >
                        <LogOut className="h-4 w-4" />
                        Logout
                    </button>
                </div>
            </aside>

            <header
                className="sticky top-0 z-30 border-b bg-white/95 px-4 py-3 backdrop-blur md:hidden"
                style={{ borderColor: `${palette.cardBorder}cc` }}
            >
                <div className="flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(true)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border"
                        style={{ borderColor: palette.cardBorder, color: palette.navy }}
                        aria-label="Open sidebar menu"
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-semibold" style={{ color: palette.navy }}>
                            {activeLabel}
                        </p>
                        <p className="truncate text-xs text-slate-500">{user?.name || 'Administrator'}</p>
                    </div>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-3 text-xs font-medium text-white"
                    >
                        Logout
                    </button>
                </div>
            </header>

            <div className={cn('fixed inset-0 z-50 md:hidden', mobileMenuOpen ? '' : 'pointer-events-none')}>
                <button
                    type="button"
                    aria-label="Close sidebar backdrop"
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                        'absolute inset-0 bg-slate-950/35 transition-opacity',
                        mobileMenuOpen ? 'opacity-100' : 'opacity-0',
                    )}
                />

                <aside
                    className={cn(
                        'absolute inset-y-0 left-0 w-72 border-r bg-white px-4 py-5 shadow-2xl transition-transform',
                        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
                    )}
                    style={{ borderColor: palette.cardBorder }}
                >
                    <div className="mb-5 flex items-center justify-between px-1">
                        <div>
                            <p
                                className="text-[11px] uppercase tracking-[0.2em]"
                                style={{ fontFamily: "'Helvetica Neue', sans-serif", color: palette.red }}
                            >
                                Admin Portal
                            </p>
                            <h2 className="mt-1 text-lg font-semibold" style={{ color: palette.navy }}>
                                Yearbook Console
                            </h2>
                        </div>
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(false)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border"
                            style={{ borderColor: palette.cardBorder, color: palette.navy }}
                            aria-label="Close sidebar menu"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <SidebarLinks />

                    <div className="mt-8">
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white"
                            style={{ background: palette.red }}
                        >
                            <LogOut className="h-4 w-4" />
                            Logout
                        </button>
                    </div>
                </aside>
            </div>

            <div className="md:pl-72">
                <main className="px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
