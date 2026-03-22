import axios from 'axios';
import { GraduationCap, Mail, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

import { yearbookPalette as palette } from '@/lib/theme';

function StatusBadge({ completed }) {
    return (
        <span
            className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.08em]"
            style={{
                border: `1px solid ${completed ? `${palette.navy}55` : `${palette.red}55`}`,
                color: completed ? palette.navy : palette.red,
                background: completed ? `${palette.navy}14` : `${palette.red}14`,
            }}
        >
            {completed ? 'Completed' : 'Pending'}
        </span>
    );
}

export default function AdminStudentsPage() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const response = await axios.get('/api/admin/students');
                setStudents(response.data.students ?? []);
            } catch (requestError) {
                setError(requestError.response?.data?.message || 'Unable to load students.');
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, []);

    if (loading) {
        return <p className="text-sm text-slate-500">Loading students...</p>;
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
                <h1 className="mt-3 text-3xl font-bold text-slate-900">Students</h1>
                <p className="mt-2 text-sm text-slate-500">
                    Track profile completion and verify role, department, and graduating year details.
                </p>
            </section>

            <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/5">
                <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:px-6">
                    <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Records</p>
                        <h2 className="mt-1 text-lg font-semibold text-slate-900">Student Directory</h2>
                    </div>
                    <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{ background: `${palette.navy}16`, color: palette.navy }}
                    >
                        <Users className="h-5 w-5" />
                    </div>
                </header>

                <div className="divide-y divide-slate-200 md:hidden">
                    {students.map((student) => (
                        <article key={student.id} className="space-y-3 px-5 py-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="font-semibold text-slate-900">{student.name}</p>
                                    <p className="mt-1 text-xs text-slate-500">{student.role}</p>
                                </div>
                                <StatusBadge completed={student.is_profile_completed} />
                            </div>
                            <p className="text-xs text-slate-600">{student.email || '-'}</p>
                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                                <p>Dept: {student.department || '-'}</p>
                                <p>Year: {student.graduating_year || '-'}</p>
                            </div>
                        </article>
                    ))}
                </div>

                <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[860px] border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-slate-200">
                                {['Name', 'Email', 'Role', 'Department', 'Year', 'Profile'].map((heading) => (
                                    <th
                                        key={heading}
                                        className="px-5 py-3 text-left text-xs uppercase tracking-[0.13em] text-slate-500"
                                        style={{ fontFamily: "'Helvetica Neue', sans-serif" }}
                                    >
                                        {heading}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {students.map((student) => (
                                <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50/70">
                                    <td className="px-5 py-3 font-medium text-slate-900">{student.name}</td>
                                    <td className="px-5 py-3 text-slate-600">
                                        <div className="inline-flex items-center gap-2">
                                            <Mail className="h-3.5 w-3.5 text-slate-400" />
                                            {student.email || '-'}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 capitalize text-slate-600">{student.role}</td>
                                    <td className="px-5 py-3 text-slate-600">{student.department || '-'}</td>
                                    <td className="px-5 py-3">
                                        <div className="inline-flex items-center gap-2 text-slate-600">
                                            <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
                                            {student.graduating_year || '-'}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <StatusBadge completed={student.is_profile_completed} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
