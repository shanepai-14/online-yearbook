import axios from 'axios';
import { BookOpenText, GraduationCap, School, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

import { yearbookPalette as palette } from '@/lib/theme';

function MetricCard({ label, value, icon: Icon, accent }) {
    return (
        <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-900/5">
            <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{label}</p>
                <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ background: `${accent}18`, color: accent }}
                >
                    <Icon className="h-4 w-4" />
                </div>
            </div>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
        </div>
    );
}

export default function AdminYearbooksPage() {
    const [yearbooks, setYearbooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchYearbooks = async () => {
            try {
                const response = await axios.get('/api/admin/yearbooks');
                setYearbooks(response.data.yearbooks ?? []);
            } catch (requestError) {
                setError(requestError.response?.data?.message || 'Unable to load yearbooks.');
            } finally {
                setLoading(false);
            }
        };

        fetchYearbooks();
    }, []);

    if (loading) {
        return <p className="text-sm text-slate-500">Loading yearbooks...</p>;
    }

    if (error) {
        return <p className="text-sm" style={{ color: palette.red }}>{error}</p>;
    }

    return (
        <div className="space-y-6">
            <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5 md:p-8">
                <p
                    className="text-xs uppercase tracking-[0.2em]"
                    style={{ fontFamily: "'Helvetica Neue', sans-serif", color: palette.red }}
                >
                    Management
                </p>
                <h1 className="mt-3 text-3xl font-bold text-slate-900">Yearbooks</h1>
                <p className="mt-2 text-sm text-slate-500">
                    Review available graduating yearbooks and their current content coverage.
                </p>
            </section>

            <section className="space-y-4">
                {yearbooks.map((yearbook) => (
                    <article key={yearbook.id} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <p
                                    className="text-xs uppercase tracking-[0.15em]"
                                    style={{ fontFamily: "'Helvetica Neue', sans-serif", color: palette.red }}
                                >
                                    Yearbook
                                </p>
                                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                                    {yearbook.school_name} • Class of {yearbook.graduating_year}
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">{yearbook.academic_year_text}</p>
                            </div>

                            <div
                                className="flex h-11 w-11 items-center justify-center rounded-xl"
                                style={{ background: `${palette.navy}16`, color: palette.navy }}
                            >
                                <BookOpenText className="h-5 w-5" />
                            </div>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                            <MetricCard
                                label="Graduates"
                                value={yearbook.graduates_count}
                                icon={GraduationCap}
                                accent={palette.navy}
                            />
                            <MetricCard
                                label="Programs"
                                value={yearbook.programs_count}
                                icon={School}
                                accent={palette.goldDark}
                            />
                            <MetricCard
                                label="Faculty"
                                value={yearbook.faculty_count}
                                icon={Users}
                                accent={palette.red}
                            />
                        </div>
                    </article>
                ))}
            </section>
        </div>
    );
}
