import axios from 'axios';
import {
    AlertCircle,
    Building2,
    CheckCircle2,
    Eye,
    GraduationCap,
    PencilLine,
    UserCircle2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import CardModal from '@/components/yearbook/CardModal';
import StudentCard from '@/components/yearbook/StudentCard';
import { Badge } from '@/components/ui/badge';
import { yearbookPalette as palette } from '@/lib/theme';

function completionPercent(profile) {
    if (!profile) {
        return 0;
    }

    const fields = ['name', 'photo', 'motto', 'badge', 'department_id', 'graduating_year'];
    const completed = fields.filter((field) => String(profile[field] || '').trim() !== '').length;

    return Math.round((completed / fields.length) * 100);
}

function InfoStat({ icon: Icon, label, value, accent }) {
    return (
        <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{label}</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
                </div>
                <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: `${accent}16`, color: accent }}
                >
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </article>
    );
}

export default function StudentDashboardPage() {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [error, setError] = useState('');
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [previewReaction, setPreviewReaction] = useState(null);
    const [previewReactionLoading, setPreviewReactionLoading] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await axios.get('/api/student/profile');
                setProfile(response.data.profile ?? null);
            } catch (requestError) {
                setError(requestError.response?.data?.message || 'Unable to load student profile.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    useEffect(() => {
        if (!profile?.id) {
            setPreviewReaction(null);
            return;
        }

        let mounted = true;

        const fetchPreviewReaction = async () => {
            setPreviewReactionLoading(true);

            try {
                const response = await axios.get(`/api/reactions/student/${profile.id}`);

                if (!mounted) {
                    return;
                }

                setPreviewReaction({
                    total: Number(response.data?.total ?? 0),
                    reacted: Boolean(response.data?.reacted),
                });
            } catch (_requestError) {
                if (!mounted) {
                    return;
                }

                setPreviewReaction(null);
            } finally {
                if (mounted) {
                    setPreviewReactionLoading(false);
                }
            }
        };

        fetchPreviewReaction();

        return () => {
            mounted = false;
        };
    }, [profile?.id]);

    const percent = useMemo(() => completionPercent(profile), [profile]);
    const isComplete = Boolean(profile?.is_profile_completed);

    if (loading) {
        return <p className="text-sm text-slate-500">Loading student dashboard...</p>;
    }

    if (error) {
        return <p className="text-sm text-red-600">{error}</p>;
    }

    if (!profile) {
        return <p className="text-sm text-slate-500">No student profile found.</p>;
    }

    return (
        <div className="space-y-6">
            <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5 md:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p
                            className="text-xs uppercase tracking-[0.2em]"
                            style={{ fontFamily: "'Helvetica Neue', sans-serif", color: palette.red }}
                        >
                            Student Portal
                        </p>
                        <h1 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl">Welcome, {profile.name}</h1>
                        <p className="mt-2 max-w-2xl text-sm text-slate-500 md:text-base">
                            Keep your yearbook profile complete so your public card appears exactly how you want it.
                        </p>
                    </div>

                    <Badge variant={isComplete ? 'success' : 'warning'} className="h-fit px-3 py-1 text-xs">
                        {isComplete ? 'Profile Completed' : 'Profile Incomplete'}
                    </Badge>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                        to="/student/profile"
                        className="inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-medium text-white transition"
                        style={{ background: palette.navy }}
                        onMouseEnter={(event) => {
                            event.currentTarget.style.background = '#16245d';
                        }}
                        onMouseLeave={(event) => {
                            event.currentTarget.style.background = palette.navy;
                        }}
                    >
                        <PencilLine className="h-4 w-4" />
                        Edit Profile
                    </Link>
                    <Link
                        to={`/graduates/${profile.graduating_year || 2025}`}
                        className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                        <Eye className="h-4 w-4" />
                        View Public Yearbook
                    </Link>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <InfoStat
                    icon={isComplete ? CheckCircle2 : AlertCircle}
                    label="Completion"
                    value={`${percent}%`}
                    accent={isComplete ? '#059669' : palette.red}
                />
                <InfoStat
                    icon={Building2}
                    label="Department"
                    value={profile.department?.label || 'Not Set'}
                    accent={palette.navy}
                />
                <InfoStat
                    icon={GraduationCap}
                    label="Graduating Year"
                    value={profile.graduating_year || '-'}
                    accent={palette.goldDark}
                />
                <InfoStat
                    icon={UserCircle2}
                    label="Badge"
                    value={profile.badge || 'Not Set'}
                    accent={palette.navyDark}
                />
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
                <div className="mb-4">
                    <p
                        className="text-xs uppercase tracking-[0.15em] text-slate-500"
                        style={{ fontFamily: "'Helvetica Neue', sans-serif" }}
                    >
                        Public Preview
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-slate-900">Your Yearbook Card</h2>
                    <p className="mt-1 text-sm text-slate-500">This is how your profile appears on the graduates page.</p>
                </div>

                <StudentCard
                    compact
                    student={profile}
                    alignment="center"
                    className="mx-auto"
                    onClick={() => setPreviewModalOpen(true)}
                />
            </section>

            <CardModal
                open={previewModalOpen}
                onOpenChange={setPreviewModalOpen}
                type="student"
                items={[profile]}
                activeIndex={0}
                onActiveIndexChange={() => {}}
                alignment="center"
                reactionsByKey={previewReaction ? { [`student:${profile.id}`]: previewReaction } : {}}
                reactionLoadingByKey={previewReactionLoading ? { [`student:${profile.id}`]: true } : {}}
                onToggleReaction={() => {}}
                allowReactionsAndComments={false}
            />
        </div>
    );
}
