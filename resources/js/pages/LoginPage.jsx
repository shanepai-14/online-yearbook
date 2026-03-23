import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Menu, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { yearbookPalette } from '@/lib/theme';

function dashboardPathForRole(role) {
    if (role === 'admin') {
        return '/admin';
    }

    return '/student';
}

const DVCLogo = () => (
    <svg viewBox="0 0 100 100" className="h-full w-full">
        <circle cx="50" cy="50" r="50" fill={yearbookPalette.navy} />
        <circle cx="50" cy="50" r="44" fill="none" stroke={yearbookPalette.gold} strokeWidth="3" />
        <ellipse cx="50" cy="50" rx="30" ry="44" fill={yearbookPalette.red} />
        <ellipse cx="50" cy="50" rx="44" ry="30" fill={yearbookPalette.red} />
        <polygon points="50,10 58,46 94,50 58,54 50,90 42,54 6,50 42,46" fill={yearbookPalette.gold} />
    </svg>
);

export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const [schoolName, setSchoolName] = useState('Davao Vision Colleges');
    const [form, setForm] = useState({
        email: '',
        password: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const loadSchoolSetting = async () => {
            try {
                const response = await axios.get('/api/school-setting');
                if (!isMounted) {
                    return;
                }

                setSchoolName(response.data.school_setting?.school_name || 'School');
            } catch (requestError) {
                if (isMounted) {
                    setSchoolName('School');
                }
            }
        };

        loadSchoolSetting();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const user = await login(form);
            const fromPath = location.state?.from?.pathname;

            navigate(fromPath || dashboardPathForRole(user.role), {
                replace: true,
            });
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="relative min-h-screen overflow-hidden px-4 py-10"
            style={{ background: yearbookPalette.lightBg }}
        >
            <nav
                className="relative z-20 mx-auto mb-6 flex h-14 w-full max-w-6xl items-center justify-between rounded-2xl border px-4 sm:px-5"
                style={{
                    borderColor: `${yearbookPalette.goldDark}66`,
                    background: `${yearbookPalette.navy}f2`,
                    backdropFilter: 'blur(6px)',
                }}
            >
                <Link to="/yearbook" className="flex min-w-0 items-center gap-3">
                    <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-white">
                        <DVCLogo />
                    </div>
                    <span
                        className="truncate text-xs uppercase tracking-[0.2em]"
                        style={{ color: yearbookPalette.gold, fontFamily: "'Helvetica Neue', sans-serif" }}
                    >
                        {schoolName} · Yearbook
                    </span>
                </Link>

                <div className="hidden items-center gap-2 sm:flex">
                    <Link
                        to="/yearbook"
                        className="rounded border px-3 py-1.5 text-xs uppercase tracking-[0.15em]"
                        style={{
                            color: 'rgba(232,217,138,0.92)',
                            borderColor: 'rgba(232,217,138,0.35)',
                            background: 'rgba(255,255,255,0.05)',
                            fontFamily: "'Helvetica Neue', sans-serif",
                        }}
                    >
                        Home
                    </Link>
                    <Link
                        to="/yearbook"
                        className="rounded border px-3 py-1.5 text-xs uppercase tracking-[0.15em]"
                        style={{
                            color: 'rgba(232,217,138,0.92)',
                            borderColor: 'rgba(232,217,138,0.35)',
                            background: 'rgba(255,255,255,0.05)',
                            fontFamily: "'Helvetica Neue', sans-serif",
                        }}
                    >
                        Browse Yearbooks
                    </Link>
                </div>

                <button
                    type="button"
                    onClick={() => setMobileMenuOpen((current) => !current)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded border sm:hidden"
                    style={{
                        borderColor: 'rgba(232,217,138,0.35)',
                        color: 'rgba(232,217,138,0.92)',
                        background: 'rgba(255,255,255,0.05)',
                    }}
                    aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                >
                    {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </button>
            </nav>

            {mobileMenuOpen ? (
                <div
                    className="relative z-20 mx-auto mb-6 w-full max-w-6xl rounded-2xl border p-3 sm:hidden"
                    style={{
                        borderColor: `${yearbookPalette.goldDark}66`,
                        background: `${yearbookPalette.navy}f2`,
                    }}
                >
                    <div className="grid gap-2">
                        <Link
                            to="/yearbook"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex h-10 items-center justify-center rounded border text-xs uppercase tracking-[0.15em]"
                            style={{
                                color: 'rgba(232,217,138,0.92)',
                                borderColor: 'rgba(232,217,138,0.35)',
                                background: 'rgba(255,255,255,0.05)',
                                fontFamily: "'Helvetica Neue', sans-serif",
                            }}
                        >
                            Home
                        </Link>
                        <Link
                            to="/yearbook"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex h-10 items-center justify-center rounded border text-xs uppercase tracking-[0.15em]"
                            style={{
                                color: 'rgba(232,217,138,0.92)',
                                borderColor: 'rgba(232,217,138,0.35)',
                                background: 'rgba(255,255,255,0.05)',
                                fontFamily: "'Helvetica Neue', sans-serif",
                            }}
                        >
                            Browse Yearbooks
                        </Link>
                    </div>
                </div>
            ) : null}

            <div
                className="pointer-events-none absolute inset-x-0 top-0 h-72"
                style={{ background: `linear-gradient(135deg, ${yearbookPalette.navy} 0%, ${yearbookPalette.navyDark} 55%, ${yearbookPalette.red} 100%)` }}
            />
            <div
                className="pointer-events-none absolute -right-16 top-12 h-56 w-56 rounded-full"
                style={{ background: 'rgba(232, 217, 138, 0.2)' }}
            />
            <div className="mx-auto grid w-full max-w-6xl items-center gap-8 lg:min-h-[82vh] lg:grid-cols-2">
                <section
                    className="relative z-10 rounded-3xl border px-6 py-8 text-white shadow-xl sm:px-8 sm:py-10"
                    style={{
                        borderColor: 'rgba(232, 217, 138, 0.25)',
                        background: `linear-gradient(145deg, ${yearbookPalette.navy} 0%, ${yearbookPalette.navyDark} 68%, rgba(184,56,40,0.95) 100%)`,
                    }}
                >
                    <p
                        className="text-xs uppercase tracking-[0.22em]"
                        style={{ color: 'rgba(232, 217, 138, 0.9)' }}
                    >
                        Online Yearbook Portal
                    </p>
                    <h1 className="mt-3 text-3xl font-semibold tracking-wide sm:text-4xl">{schoolName}</h1>
                    <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/85 sm:text-base">
                        Sign in as a student or admin to manage yearbook data, while guests continue to browse public graduate pages.
                    </p>
                    <div className="mt-8 hidden max-w-lg gap-3 sm:grid sm:grid-cols-2">
                        <div className="rounded-2xl border border-white/25 bg-white/10 px-4 py-4 backdrop-blur">
                            <p className="text-xs uppercase tracking-[0.15em] text-white/80">Student Access</p>
                            <p className="mt-2 text-sm text-white">Update your profile and public yearbook card.</p>
                        </div>
                        <div className="rounded-2xl border border-white/25 bg-white/10 px-4 py-4 backdrop-blur">
                            <p className="text-xs uppercase tracking-[0.15em] text-white/80">Admin Access</p>
                            <p className="mt-2 text-sm text-white">Manage yearbooks, departments, and student records.</p>
                        </div>
                    </div>
                </section>

                <Card
                    className="relative z-10 w-full border-[1.5px] shadow-2xl"
                    style={{ borderColor: yearbookPalette.cardBorder }}
                >
                    <CardHeader className="space-y-2 pb-4">
                        <p
                            className="text-xs uppercase tracking-[0.2em]"
                            style={{ color: yearbookPalette.red }}
                        >
                            Secure Sign In
                        </p>
                        <CardTitle
                            className="text-2xl sm:text-3xl"
                            style={{ color: yearbookPalette.navy }}
                        >
                            Welcome Back
                        </CardTitle>
                        <CardDescription className="text-sm leading-relaxed text-slate-600">
                            Continue to{' '}
                            <span className="font-semibold" style={{ color: yearbookPalette.navy }}>
                                {schoolName}
                            </span>{' '}
                            yearbook workspace.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" style={{ color: yearbookPalette.navy }}>
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="student@yearbook.test"
                                    value={form.email}
                                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                                    className="h-11 border-slate-300 focus-visible:ring-2 focus-visible:ring-[#1a2a6c]/35 focus-visible:ring-offset-0"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" style={{ color: yearbookPalette.navy }}>
                                    Password
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={form.password}
                                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                                    className="h-11 border-slate-300 focus-visible:ring-2 focus-visible:ring-[#1a2a6c]/35 focus-visible:ring-offset-0"
                                    required
                                />
                            </div>

                            {error ? (
                                <p className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'rgba(184,56,40,0.25)', color: yearbookPalette.red }}>
                                    {error}
                                </p>
                            ) : null}

                            <Button
                                className="h-11 w-full text-sm font-semibold tracking-wide"
                                style={{ background: yearbookPalette.navy, color: 'white' }}
                                type="submit"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Signing in...' : 'Sign in'}
                            </Button>


                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
