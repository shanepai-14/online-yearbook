import axios from 'axios';
import { GraduationCap, Loader2, Mail, UserCheck, UserX, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { yearbookPalette as palette } from '@/lib/theme';

function ProfileStatusBadge({ completed }) {
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

function AccountStatusBadge({ isActive }) {
    return (
        <span
            className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.08em]"
            style={{
                border: `1px solid ${isActive ? 'rgba(22,163,74,0.35)' : 'rgba(100,116,139,0.35)'}`,
                color: isActive ? 'rgb(22, 101, 52)' : 'rgb(71, 85, 105)',
                background: isActive ? 'rgba(22,163,74,0.12)' : 'rgba(100,116,139,0.12)',
            }}
        >
            {isActive ? 'Active' : 'Inactive'}
        </span>
    );
}

function firstApiError(error, fallbackMessage) {
    const fieldErrors = error?.response?.data?.errors;

    if (fieldErrors && typeof fieldErrors === 'object') {
        const firstField = Object.keys(fieldErrors)[0];
        const firstMessage = fieldErrors[firstField]?.[0];

        if (firstMessage) {
            return firstMessage;
        }
    }

    return error?.response?.data?.message || fallbackMessage;
}

export default function AdminStudentsPage() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [busyStudentId, setBusyStudentId] = useState(null);
    const [search, setSearch] = useState('');

    const loadStudents = useCallback(async () => {
        setLoading(true);

        try {
            const response = await axios.get('/api/admin/students');
            setStudents(response.data.students ?? []);
            setError('');
        } catch (requestError) {
            setError(firstApiError(requestError, 'Unable to load students.'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadStudents();
    }, [loadStudents]);

    const filteredStudents = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        if (!keyword) {
            return students;
        }

        return students.filter((student) => {
            const haystack = [
                student.name,
                student.email,
                student.department,
                student.department_full_name,
                student.graduating_year,
                student.registration_link_title,
            ]
                .map((value) => String(value || '').toLowerCase())
                .join(' ');

            return haystack.includes(keyword);
        });
    }, [search, students]);

    const handleToggleStatus = async (student) => {
        if (!student?.id || !student?.user_id || busyStudentId !== null) {
            return;
        }

        setBusyStudentId(student.id);
        setError('');
        setNotice('');

        try {
            const response = await axios.patch(`/api/admin/students/${student.id}/status`, {
                is_active: !student.is_active,
            });
            const nextStudent = response.data?.student;

            if (nextStudent) {
                setStudents((current) =>
                    current.map((item) => (item.id === nextStudent.id ? nextStudent : item)),
                );
            } else {
                await loadStudents();
            }

            setNotice(response.data?.message || 'Student account status updated.');
        } catch (requestError) {
            setError(firstApiError(requestError, 'Unable to update student account status.'));
        } finally {
            setBusyStudentId(null);
        }
    };

    const renderToggleButton = (student, fullWidth = false) => {
        if (!student.user_id) {
            return (
                <Button type="button" variant="outline" size="sm" disabled className={fullWidth ? 'w-full' : ''}>
                    No Login Account
                </Button>
            );
        }

        const isBusy = busyStudentId === student.id;

        return (
            <Button
                type="button"
                size="sm"
                variant={student.is_active ? 'destructive' : 'outline'}
                className={
                    student.is_active
                        ? fullWidth
                            ? 'w-full'
                            : ''
                        : `${fullWidth ? 'w-full ' : ''}border-emerald-300 text-emerald-700 hover:bg-emerald-50`
                }
                disabled={isBusy}
                onClick={() => handleToggleStatus(student)}
            >
                {isBusy ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                {!isBusy && student.is_active ? <UserX className="mr-2 h-3.5 w-3.5" /> : null}
                {!isBusy && !student.is_active ? <UserCheck className="mr-2 h-3.5 w-3.5" /> : null}
                {isBusy ? 'Updating...' : student.is_active ? 'Deactivate' : 'Activate'}
            </Button>
        );
    };

    if (loading) {
        return <p className="text-sm text-slate-500">Loading students...</p>;
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
                            Management
                        </p>
                        <h1 className="mt-3 text-3xl font-bold text-slate-900">Students</h1>
                        <p className="mt-2 text-sm text-slate-500">
                            Manage student records, check profile completion, and activate or deactivate student access.
                        </p>
                    </div>

                    <div className="w-full max-w-sm space-y-2">
                        <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Search</p>
                        <input
                            type="text"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search by name, email, department, or year"
                            className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-800 outline-none ring-0 transition focus:border-slate-500"
                        />
                    </div>
                </div>
            </section>

            {error ? <p className="text-sm" style={{ color: palette.red }}>{error}</p> : null}
            {notice ? <p className="text-sm text-emerald-700">{notice}</p> : null}

            <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/5">
                <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:px-6">
                    <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Records</p>
                        <h2 className="mt-1 text-lg font-semibold text-slate-900">Student Directory</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">{filteredStudents.length} shown</span>
                        <div
                            className="flex h-10 w-10 items-center justify-center rounded-xl"
                            style={{ background: `${palette.navy}16`, color: palette.navy }}
                        >
                            <Users className="h-5 w-5" />
                        </div>
                    </div>
                </header>

                <div className="divide-y divide-slate-200 md:hidden">
                    {filteredStudents.length === 0 ? (
                        <p className="px-5 py-6 text-sm text-slate-500">No students match your search.</p>
                    ) : null}

                    {filteredStudents.map((student) => (
                        <article key={student.id} className="space-y-3 px-5 py-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="font-semibold text-slate-900">{student.name}</p>
                                    <p className="mt-1 text-xs text-slate-500">{student.role}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1.5">
                                    <ProfileStatusBadge completed={student.is_profile_completed} />
                                    <AccountStatusBadge isActive={student.is_active} />
                                </div>
                            </div>
                            <p className="text-xs text-slate-600">{student.email || '-'}</p>
                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                                <p>Dept: {student.department || '-'}</p>
                                <p>Year: {student.graduating_year || '-'}</p>
                            </div>
                            <p className="text-xs text-slate-500">Link: {student.registration_link_title || '-'}</p>
                            <div>{renderToggleButton(student, true)}</div>
                        </article>
                    ))}
                </div>

                <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[1140px] border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-slate-200">
                                {[
                                    'Name',
                                    'Email',
                                    'Role',
                                    'Department',
                                    'Year',
                                    'Registration Link',
                                    'Profile',
                                    'Account',
                                    'Action',
                                ].map((heading) => (
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
                            {filteredStudents.length === 0 ? (
                                <tr>
                                    <td className="px-5 py-6 text-sm text-slate-500" colSpan={9}>
                                        No students match your search.
                                    </td>
                                </tr>
                            ) : null}

                            {filteredStudents.map((student) => (
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
                                    <td className="px-5 py-3 text-slate-600">{student.registration_link_title || '-'}</td>
                                    <td className="px-5 py-3">
                                        <ProfileStatusBadge completed={student.is_profile_completed} />
                                    </td>
                                    <td className="px-5 py-3">
                                        <AccountStatusBadge isActive={student.is_active} />
                                    </td>
                                    <td className="px-5 py-3">{renderToggleButton(student)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
