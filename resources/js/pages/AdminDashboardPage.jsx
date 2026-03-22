import axios from 'axios';
import { BookOpenText, Building2, CheckCircle2, Clock3, LayoutGrid, Link2, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { yearbookPalette as palette } from '@/lib/theme';

function StatCard({ title, value, description, icon: Icon, accent }) {
    return (
        <article className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p
                        className="text-xs uppercase tracking-[0.14em] text-slate-500"
                        style={{ fontFamily: "'Helvetica Neue', sans-serif" }}
                    >
                        {title}
                    </p>
                    <p className="mt-3 text-3xl font-semibold leading-none text-slate-900">{value}</p>
                    <p className="mt-3 text-xs text-slate-500">{description}</p>
                </div>

                <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ background: `${accent}1c`, color: accent }}
                >
                    <Icon className="h-5 w-5" />
                </div>
            </div>

            <div className="mt-5 h-1 rounded-full" style={{ background: `${accent}3f` }} />
        </article>
    );
}

export default function AdminDashboardPage() {
    const [students, setStudents] = useState([]);
    const [yearbooks, setYearbooks] = useState([]);
    const [schoolName, setSchoolName] = useState('');
    const [contentAlignment, setContentAlignment] = useState('left');
    const [savingSettings, setSavingSettings] = useState(false);
    const [settingsMessage, setSettingsMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                const [studentsResponse, yearbooksResponse, schoolSettingResponse] = await Promise.all([
                    axios.get('/api/admin/students'),
                    axios.get('/api/admin/yearbooks'),
                    axios.get('/api/admin/school-setting'),
                ]);

                setStudents(studentsResponse.data.students ?? []);
                setYearbooks(yearbooksResponse.data.yearbooks ?? []);
                setSchoolName(schoolSettingResponse.data.school_setting?.school_name ?? 'School');
                setContentAlignment(schoolSettingResponse.data.school_setting?.graduates_content_alignment ?? 'left');
            } catch (requestError) {
                setError(requestError.response?.data?.message || 'Unable to load admin dashboard data.');
            } finally {
                setLoading(false);
            }
        };

        fetchAdminData();
    }, []);

    const stats = useMemo(() => {
        const totalStudents = students.length;
        const completedProfiles = students.filter((student) => student.is_profile_completed).length;
        const pendingProfiles = totalStudents - completedProfiles;
        const totalDepartments = yearbooks.reduce((sum, yearbook) => sum + (yearbook.programs_count || 0), 0);

        return {
            totalStudents,
            completedProfiles,
            pendingProfiles,
            totalDepartments,
        };
    }, [students, yearbooks]);

    const handleSaveSettings = async () => {
        setSavingSettings(true);
        setSettingsMessage('');

        try {
            const response = await axios.put('/api/admin/school-setting', {
                school_name: schoolName,
                graduates_content_alignment: contentAlignment,
            });

            setSchoolName(response.data.school_setting?.school_name ?? schoolName);
            setContentAlignment(response.data.school_setting?.graduates_content_alignment ?? contentAlignment);
            setSettingsMessage('Layout settings saved.');
        } catch (requestError) {
            setSettingsMessage(requestError.response?.data?.message || 'Unable to save settings.');
        } finally {
            setSavingSettings(false);
        }
    };

    if (loading) {
        return (
            <p className="text-sm text-slate-500">
                Loading admin dashboard...
            </p>
        );
    }

    if (error) {
        return (
            <p className="text-sm" style={{ color: palette.red }}>
                {error}
            </p>
        );
    }

    return (
        <div className="space-y-6">
            <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5 md:p-8">
                <p
                    className="text-xs uppercase tracking-[0.2em]"
                    style={{ fontFamily: "'Helvetica Neue', sans-serif", color: palette.red }}
                >
                    Administration
                </p>
                <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-900 md:text-4xl">
                    Dashboard Overview
                </h1>
                <p className="mt-3 max-w-2xl text-sm text-slate-500 md:text-base">
                    Monitor student completion, manage yearbook setup, and keep graduation pages aligned with your
                    current school branding.
                </p>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Total Students"
                    value={stats.totalStudents}
                    description="All student profiles in the current portal."
                    icon={Users}
                    accent={palette.navy}
                />
                <StatCard
                    title="Completed Profiles"
                    value={stats.completedProfiles}
                    description="Students ready for public yearbook display."
                    icon={CheckCircle2}
                    accent={palette.goldDark}
                />
                <StatCard
                    title="Pending Profiles"
                    value={stats.pendingProfiles}
                    description="Profiles still missing required details."
                    icon={Clock3}
                    accent={palette.red}
                />
                <StatCard
                    title="Total Departments"
                    value={stats.totalDepartments}
                    description="Programs connected to all yearbooks."
                    icon={Building2}
                    accent={palette.navyDark}
                />
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
                <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                        <p
                            className="text-xs uppercase tracking-[0.15em] text-slate-500"
                            style={{ fontFamily: "'Helvetica Neue', sans-serif" }}
                        >
                            Graduates Page Settings
                        </p>
                        <h2 className="mt-2 text-2xl font-bold text-slate-900">Brand & Layout</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Update school display name and alignment preference for the graduates public page.
                        </p>
                    </div>
                    <div
                        className="hidden h-11 w-11 items-center justify-center rounded-xl md:flex"
                        style={{ background: `${palette.navy}18`, color: palette.navy }}
                    >
                        <LayoutGrid className="h-5 w-5" />
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label
                            htmlFor="school_name"
                            className="text-xs uppercase tracking-[0.12em] text-slate-500"
                            style={{ fontFamily: "'Helvetica Neue', sans-serif" }}
                        >
                            School Name
                        </Label>
                        <Input
                            id="school_name"
                            type="text"
                            value={schoolName}
                            onChange={(event) => setSchoolName(event.target.value)}
                            className="h-11 rounded-xl border-slate-200 focus-visible:ring-[#1a2a6c]/30"
                            placeholder="Enter school name"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label
                            htmlFor="content_alignment"
                            className="text-xs uppercase tracking-[0.12em] text-slate-500"
                            style={{ fontFamily: "'Helvetica Neue', sans-serif" }}
                        >
                            Content Alignment
                        </Label>
                        <select
                            id="content_alignment"
                            value={contentAlignment}
                            onChange={(event) => setContentAlignment(event.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[#1a2a6c] focus:ring-2 focus:ring-[#1a2a6c]/30"
                        >
                            <option value="left">Left (Default)</option>
                            <option value="center">Centered</option>
                            <option value="right">Right</option>
                        </select>
                    </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={handleSaveSettings}
                        disabled={savingSettings}
                        className="inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-medium text-white transition disabled:opacity-60"
                        style={{ background: palette.navy }}
                        onMouseEnter={(event) => {
                            event.currentTarget.style.background = '#16245d';
                        }}
                        onMouseLeave={(event) => {
                            event.currentTarget.style.background = palette.navy;
                        }}
                    >
                        {savingSettings ? 'Saving...' : 'Save Changes'}
                    </button>

                    <Link
                        to="/admin/yearbooks"
                        className="inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-medium text-white transition"
                        style={{ background: palette.red }}
                        onMouseEnter={(event) => {
                            event.currentTarget.style.background = '#a53124';
                        }}
                        onMouseLeave={(event) => {
                            event.currentTarget.style.background = palette.red;
                        }}
                    >
                        Manage Yearbooks
                    </Link>

                    {settingsMessage ? (
                        <span
                            className="text-sm"
                            style={{ color: settingsMessage === 'Layout settings saved.' ? palette.navy : palette.red }}
                        >
                            {settingsMessage}
                        </span>
                    ) : null}
                </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
                <p
                    className="text-xs uppercase tracking-[0.15em] text-slate-500"
                    style={{ fontFamily: "'Helvetica Neue', sans-serif" }}
                >
                    Quick Navigation
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                        to="/admin/yearbooks"
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                        <BookOpenText className="h-4 w-4" />
                        Yearbooks
                    </Link>
                    <Link
                        to="/admin/students"
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                        <Users className="h-4 w-4" />
                        Students
                    </Link>
                    <Link
                        to="/admin/registration-links"
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                        <Link2 className="h-4 w-4" />
                        Registration Links
                    </Link>
                </div>
            </section>
        </div>
    );
}
