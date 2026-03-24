import axios from 'axios';
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    Download,
    GraduationCap,
    Loader2,
    Mail,
    SquarePen,
    UserCheck,
    UserX,
    Users,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import StudentCard from '@/components/yearbook/StudentCard';
import { STUDENT_GENDER_OPTIONS } from '@/lib/placeholders';
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

function escapeCsvValue(value) {
    return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

export default function AdminStudentsPage() {
    const emptyEditForm = {
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        yearbook_id: '',
        department_id: '',
        gender: '',
        motto: '',
        badge: '',
        photo: '',
        photo_upload: null,
        is_active: true,
    };

    const [students, setStudents] = useState([]);
    const [yearbooks, setYearbooks] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [busyStudentId, setBusyStudentId] = useState(null);
    const [search, setSearch] = useState('');
    const [filterYear, setFilterYear] = useState('all');
    const [filterDepartment, setFilterDepartment] = useState('all');
    const [filterProfileStatus, setFilterProfileStatus] = useState('all');
    const [filterAccountStatus, setFilterAccountStatus] = useState('all');
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
    const [pageSize, setPageSize] = useState('10');
    const [currentPage, setCurrentPage] = useState(1);
    const [editStudentOpen, setEditStudentOpen] = useState(false);
    const [editingStudentId, setEditingStudentId] = useState(null);
    const [editForm, setEditForm] = useState(emptyEditForm);
    const [editPhotoPreview, setEditPhotoPreview] = useState('');
    const [savingEdit, setSavingEdit] = useState(false);

    const loadStudents = useCallback(async () => {
        setLoading(true);

        try {
            const response = await axios.get('/api/admin/students');
            setStudents(response.data.students ?? []);
            setYearbooks(response.data.options?.yearbooks ?? []);
            setDepartments(response.data.options?.departments ?? []);
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

    useEffect(() => {
        if (!editStudentOpen) {
            setEditPhotoPreview('');
            return;
        }

        if (editForm.photo_upload instanceof File) {
            const localPreviewUrl = URL.createObjectURL(editForm.photo_upload);
            setEditPhotoPreview(localPreviewUrl);

            return () => {
                URL.revokeObjectURL(localPreviewUrl);
            };
        }

        setEditPhotoPreview(String(editForm.photo || '').trim());
    }, [editForm.photo, editForm.photo_upload, editStudentOpen]);

    const yearFilterOptions = useMemo(() => {
        return Array.from(
            new Set(
                students
                    .map((student) => String(student.graduating_year || '').trim())
                    .filter((value) => value !== ''),
            ),
        ).sort((a, b) => Number(b) - Number(a));
    }, [students]);

    const departmentFilterOptions = useMemo(() => {
        return Array.from(
            new Set(
                students
                    .map((student) => String(student.department || '').trim())
                    .filter((value) => value !== ''),
            ),
        ).sort((a, b) => a.localeCompare(b));
    }, [students]);

    const filteredStudents = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        const matchesFilters = students.filter((student) => {
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

            if (keyword && !haystack.includes(keyword)) {
                return false;
            }

            if (filterYear !== 'all' && String(student.graduating_year || '') !== filterYear) {
                return false;
            }

            if (filterDepartment !== 'all' && String(student.department || '') !== filterDepartment) {
                return false;
            }

            if (filterProfileStatus === 'completed' && !student.is_profile_completed) {
                return false;
            }

            if (filterProfileStatus === 'pending' && student.is_profile_completed) {
                return false;
            }

            if (filterAccountStatus === 'active' && !student.is_active) {
                return false;
            }

            if (filterAccountStatus === 'inactive' && student.is_active) {
                return false;
            }

            return true;
        });

        const sortValue = (student) => {
            switch (sortConfig.key) {
                case 'name':
                    return String(student.name || '');
                case 'email':
                    return String(student.email || '');
                case 'role':
                    return String(student.role || '');
                case 'department':
                    return String(student.department || '');
                case 'year':
                    return Number(student.graduating_year || 0);
                case 'registration':
                    return String(student.registration_link_title || '');
                case 'profile':
                    return student.is_profile_completed ? 1 : 0;
                case 'account':
                    return student.is_active ? 1 : 0;
                default:
                    return String(student.name || '');
            }
        };

        return [...matchesFilters].sort((left, right) => {
            const leftValue = sortValue(left);
            const rightValue = sortValue(right);

            let result = 0;

            if (typeof leftValue === 'number' && typeof rightValue === 'number') {
                result = leftValue - rightValue;
            } else {
                result = String(leftValue).localeCompare(String(rightValue), undefined, {
                    sensitivity: 'base',
                    numeric: true,
                });
            }

            if (result === 0) {
                result = Number(left.id || 0) - Number(right.id || 0);
            }

            return sortConfig.direction === 'asc' ? result : -result;
        });
    }, [
        filterAccountStatus,
        filterDepartment,
        filterProfileStatus,
        filterYear,
        search,
        sortConfig.direction,
        sortConfig.key,
        students,
    ]);

    const effectivePageSize = useMemo(() => {
        if (pageSize === 'all') {
            return Math.max(filteredStudents.length, 1);
        }

        return Math.max(Number(pageSize) || 10, 1);
    }, [filteredStudents.length, pageSize]);

    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(filteredStudents.length / effectivePageSize));
    }, [effectivePageSize, filteredStudents.length]);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, filterYear, filterDepartment, filterProfileStatus, filterAccountStatus, sortConfig.key, sortConfig.direction, pageSize]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const paginatedStudents = useMemo(() => {
        const startIndex = (currentPage - 1) * effectivePageSize;

        return filteredStudents.slice(startIndex, startIndex + effectivePageSize);
    }, [currentPage, effectivePageSize, filteredStudents]);

    const filteredDepartmentOptions = useMemo(() => {
        if (!editForm.yearbook_id) {
            return departments;
        }

        return departments.filter((department) => String(department.yearbook_id) === String(editForm.yearbook_id));
    }, [departments, editForm.yearbook_id]);

    const previewStudentCard = useMemo(
        () => ({
            name: editForm.name,
            gender: editForm.gender,
            photo: editPhotoPreview,
            motto: editForm.motto,
            badge: editForm.badge,
        }),
        [editForm.badge, editForm.gender, editForm.motto, editForm.name, editPhotoPreview],
    );

    const handleSort = (key) => {
        setSortConfig((current) => {
            if (current.key === key) {
                return {
                    key,
                    direction: current.direction === 'asc' ? 'desc' : 'asc',
                };
            }

            return {
                key,
                direction: 'asc',
            };
        });
    };

    const renderSortIcon = (key) => {
        if (sortConfig.key !== key) {
            return <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />;
        }

        return sortConfig.direction === 'asc' ? (
            <ArrowUp className="h-3.5 w-3.5 text-slate-700" />
        ) : (
            <ArrowDown className="h-3.5 w-3.5 text-slate-700" />
        );
    };

    const resetFilters = () => {
        setFilterYear('all');
        setFilterDepartment('all');
        setFilterProfileStatus('all');
        setFilterAccountStatus('all');
        setSearch('');
        setCurrentPage(1);
    };

    const exportStudentDirectory = () => {
        if (filteredStudents.length === 0) {
            return;
        }

        const header = [
            'ID',
            'Name',
            'Email',
            'Role',
            'Department',
            'Graduating Year',
            'Registration Link',
            'Profile Status',
            'Account Status',
        ];

        const rows = filteredStudents.map((student) => [
            student.id,
            student.name,
            student.email,
            student.role,
            student.department,
            student.graduating_year,
            student.registration_link_title,
            student.is_profile_completed ? 'Completed' : 'Pending',
            student.is_active ? 'Active' : 'Inactive',
        ]);

        const csvContent = `\uFEFF${[header, ...rows]
            .map((row) => row.map((value) => escapeCsvValue(value)).join(','))
            .join('\n')}`;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const fileDate = new Date().toISOString().slice(0, 10);
        const link = document.createElement('a');

        link.href = url;
        link.setAttribute('download', `student-directory-${fileDate}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

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

    const openEditModal = (student) => {
        if (!student?.id) {
            return;
        }

        setEditingStudentId(student.id);
        setEditForm({
            name: student.name ?? '',
            email: student.email ?? '',
            password: '',
            password_confirmation: '',
            yearbook_id: student.yearbook_id ? String(student.yearbook_id) : '',
            department_id: student.department_id ? String(student.department_id) : '',
            gender: student.gender ?? '',
            motto: student.motto ?? '',
            badge: student.badge ?? '',
            photo: student.photo ?? '',
            photo_upload: null,
            is_active: Boolean(student.is_active),
        });
        setEditStudentOpen(true);
    };

    const updateEditField = (field, value) => {
        setEditForm((current) => {
            if (field === 'yearbook_id') {
                const selectedYearDepartments = departments.filter(
                    (department) => String(department.yearbook_id) === String(value),
                );
                const hasCurrentDepartment = selectedYearDepartments.some(
                    (department) => String(department.id) === String(current.department_id),
                );

                return {
                    ...current,
                    yearbook_id: value,
                    department_id: hasCurrentDepartment ? current.department_id : '',
                };
            }

            return {
                ...current,
                [field]: value,
            };
        });
    };

    const handleSaveStudent = async (event) => {
        event.preventDefault();

        if (!editingStudentId || savingEdit) {
            return;
        }

        setSavingEdit(true);
        setError('');
        setNotice('');

        const payload = new FormData();
        payload.append('_method', 'PUT');
        payload.append('name', editForm.name);
        payload.append('email', editForm.email);
        payload.append('yearbook_id', String(editForm.yearbook_id || ''));
        payload.append('department_id', String(editForm.department_id || ''));
        payload.append('gender', editForm.gender || '');
        payload.append('motto', editForm.motto);
        payload.append('badge', editForm.badge);
        payload.append('photo', editForm.photo);
        payload.append('is_active', editForm.is_active ? '1' : '0');

        if (editForm.password.trim() !== '') {
            payload.append('password', editForm.password);
            payload.append('password_confirmation', editForm.password_confirmation);
        }

        if (editForm.photo_upload instanceof File) {
            payload.append('photo_upload', editForm.photo_upload);
        }

        try {
            const response = await axios.post(`/api/admin/students/${editingStudentId}`, payload, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            const nextStudent = response.data?.student;

            if (nextStudent) {
                setStudents((current) => current.map((item) => (item.id === nextStudent.id ? nextStudent : item)));
            } else {
                await loadStudents();
            }

            setNotice(response.data?.message || 'Student updated successfully.');
            setEditStudentOpen(false);
            setEditingStudentId(null);
            setEditForm(emptyEditForm);
        } catch (requestError) {
            setError(firstApiError(requestError, 'Unable to update student.'));
        } finally {
            setSavingEdit(false);
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

    const renderEditButton = (student, fullWidth = false) => {
        return (
            <Button
                type="button"
                size="sm"
                variant="outline"
                className={fullWidth ? 'w-full' : ''}
                onClick={() => openEditModal(student)}
            >
                <SquarePen className="mr-2 h-3.5 w-3.5" />
                Edit
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

                <div className="mt-5 grid gap-3 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto_auto]">
                    <div className="space-y-1.5">
                        <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Year</p>
                        <select
                            value={filterYear}
                            onChange={(event) => setFilterYear(event.target.value)}
                            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                        >
                            <option value="all">All Years</option>
                            {yearFilterOptions.map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Department</p>
                        <select
                            value={filterDepartment}
                            onChange={(event) => setFilterDepartment(event.target.value)}
                            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                        >
                            <option value="all">All Departments</option>
                            {departmentFilterOptions.map((department) => (
                                <option key={department} value={department}>
                                    {department}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Profile</p>
                        <select
                            value={filterProfileStatus}
                            onChange={(event) => setFilterProfileStatus(event.target.value)}
                            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                        >
                            <option value="all">All</option>
                            <option value="completed">Completed</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Account</p>
                        <select
                            value={filterAccountStatus}
                            onChange={(event) => setFilterAccountStatus(event.target.value)}
                            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                        >
                            <option value="all">All</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        className="self-end"
                        onClick={resetFilters}
                    >
                        Reset
                    </Button>

                    <Button
                        type="button"
                        className="self-end"
                        style={{ background: palette.navy, color: '#fff' }}
                        onClick={exportStudentDirectory}
                        disabled={filteredStudents.length === 0}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Export Excel
                    </Button>
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
                        <span className="text-xs text-slate-500">
                            {paginatedStudents.length} of {filteredStudents.length} shown
                        </span>
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

                    {paginatedStudents.map((student) => (
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
                            <div className="grid grid-cols-2 gap-2">
                                {renderEditButton(student, true)}
                                {renderToggleButton(student, true)}
                            </div>
                        </article>
                    ))}
                </div>

                <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[1140px] border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-slate-200">
                                {[
                                    ['Name', 'name'],
                                    ['Email', 'email'],
                                    ['Role', 'role'],
                                    ['Department', 'department'],
                                    ['Year', 'year'],
                                    ['Registration Link', 'registration'],
                                    ['Profile', 'profile'],
                                    ['Account', 'account'],
                                ].map(([heading, sortKey]) => (
                                    <th
                                        key={heading}
                                        className="px-5 py-3 text-left text-xs uppercase tracking-[0.13em] text-slate-500"
                                        style={{ fontFamily: "'Helvetica Neue', sans-serif" }}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => handleSort(sortKey)}
                                            className="inline-flex items-center gap-1.5 transition hover:text-slate-700"
                                        >
                                            <span>{heading}</span>
                                            {renderSortIcon(sortKey)}
                                        </button>
                                    </th>
                                ))}
                                <th
                                    className="px-5 py-3 text-left text-xs uppercase tracking-[0.13em] text-slate-500"
                                    style={{ fontFamily: "'Helvetica Neue', sans-serif" }}
                                >
                                    Action
                                </th>
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

                            {paginatedStudents.map((student) => (
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
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-2">
                                            {renderEditButton(student)}
                                            {renderToggleButton(student)}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredStudents.length > 0 ? (
                    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4 sm:px-6">
                        <p className="text-xs text-slate-500">
                            Page {currentPage} of {totalPages} · {filteredStudents.length} result
                            {filteredStudents.length === 1 ? '' : 's'}
                        </p>

                        <div className="flex flex-wrap items-center gap-2">
                            <label htmlFor="students_page_size" className="text-xs text-slate-500">
                                Rows
                            </label>
                            <select
                                id="students_page_size"
                                value={pageSize}
                                onChange={(event) => setPageSize(event.target.value)}
                                className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                            >
                                {[10, 25, 50, 100].map((size) => (
                                    <option key={size} value={size}>
                                        {size}
                                    </option>
                                ))}
                                <option value="all">All</option>
                            </select>

                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setCurrentPage((current) => Math.max(current - 1, 1))}
                                disabled={currentPage <= 1}
                            >
                                Previous
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setCurrentPage((current) => Math.min(current + 1, totalPages))}
                                disabled={currentPage >= totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    </footer>
                ) : null}
            </section>

            <Dialog
                open={editStudentOpen}
                onOpenChange={(open) => {
                    setEditStudentOpen(open);

                    if (!open) {
                        setEditingStudentId(null);
                        setEditForm(emptyEditForm);
                        setSavingEdit(false);
                    }
                }}
            >
                <DialogContent className="flex items-center justify-center p-4">
                    <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10">
                        <div className="mb-4 flex items-start justify-between gap-3">
                            <div>
                                <p
                                    className="text-xs uppercase tracking-[0.15em]"
                                    style={{ fontFamily: "'Helvetica Neue', sans-serif", color: palette.red }}
                                >
                                    Student Directory
                                </p>
                                <h3 className="mt-1 text-xl font-semibold text-slate-900">Edit Student</h3>
                                <p className="mt-1 text-xs text-slate-500">
                                    Update profile and login credentials. Leave password blank to keep the current password.
                                </p>
                            </div>
                            <DialogClose className="h-9 w-9 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
                                <X className="mx-auto h-4 w-4" />
                            </DialogClose>
                        </div>

                        <form onSubmit={handleSaveStudent} className="max-h-[72vh] space-y-4 overflow-y-auto pr-1">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="edit_student_name">Name</Label>
                                    <Input
                                        id="edit_student_name"
                                        value={editForm.name}
                                        onChange={(event) => updateEditField('name', event.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit_student_email">Email</Label>
                                    <Input
                                        id="edit_student_email"
                                        type="email"
                                        value={editForm.email}
                                        onChange={(event) => updateEditField('email', event.target.value)}
                                        placeholder="student@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="edit_student_password">Password</Label>
                                    <Input
                                        id="edit_student_password"
                                        type="password"
                                        value={editForm.password}
                                        onChange={(event) => updateEditField('password', event.target.value)}
                                        placeholder="Leave blank to keep current password"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit_student_password_confirmation">Confirm Password</Label>
                                    <Input
                                        id="edit_student_password_confirmation"
                                        type="password"
                                        value={editForm.password_confirmation}
                                        onChange={(event) => updateEditField('password_confirmation', event.target.value)}
                                        placeholder="Re-enter new password"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="edit_student_yearbook">Year</Label>
                                    <select
                                        id="edit_student_yearbook"
                                        value={editForm.yearbook_id}
                                        onChange={(event) => updateEditField('yearbook_id', event.target.value)}
                                        className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                                        required
                                    >
                                        <option value="">Select year</option>
                                        {yearbooks.map((yearbook) => (
                                            <option key={yearbook.id} value={yearbook.id}>
                                                {yearbook.graduating_year} - {yearbook.academic_year_text}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit_student_department">Department</Label>
                                    <select
                                        id="edit_student_department"
                                        value={editForm.department_id}
                                        onChange={(event) => updateEditField('department_id', event.target.value)}
                                        className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                                        required
                                    >
                                        <option value="">Select department</option>
                                        {filteredDepartmentOptions.map((department) => (
                                            <option key={department.id} value={department.id}>
                                                {department.label} - {department.full_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2 md:max-w-xs">
                                <Label htmlFor="edit_student_gender">Gender</Label>
                                <select
                                    id="edit_student_gender"
                                    value={editForm.gender}
                                    onChange={(event) => updateEditField('gender', event.target.value)}
                                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                                >
                                    <option value="">Prefer not to say</option>
                                    {STUDENT_GENDER_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="edit_student_motto">Motto</Label>
                                    <Input
                                        id="edit_student_motto"
                                        value={editForm.motto}
                                        onChange={(event) => updateEditField('motto', event.target.value)}
                                        placeholder="Build with purpose."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit_student_badge">Badge</Label>
                                    <Input
                                        id="edit_student_badge"
                                        value={editForm.badge}
                                        onChange={(event) => updateEditField('badge', event.target.value)}
                                        placeholder="Honor Student"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_220px]">
                                <div className="space-y-2">
                                    <Label htmlFor="edit_student_photo">Photo URL</Label>
                                    <Input
                                        id="edit_student_photo"
                                        value={editForm.photo}
                                        onChange={(event) => updateEditField('photo', event.target.value)}
                                        placeholder="https://..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit_student_photo_upload">Upload Photo</Label>
                                    <Input
                                        id="edit_student_photo_upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={(event) => updateEditField('photo_upload', event.target.files?.[0] || null)}
                                        className="cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
                                    />
                                    <p className="truncate text-[11px] text-slate-500">
                                        {editForm.photo_upload?.name || 'Upload JPG/PNG/WebP (max 15MB).'}
                                    </p>
                                </div>
                                <div className="space-y-2 md:justify-self-end">
                                    <Label>Preview</Label>
                                    <StudentCard
                                        compact
                                        alignment="center"
                                        student={previewStudentCard}
                                        className="mx-auto max-w-[200px]"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit_student_status_toggle">Account Status</Label>
                                <button
                                    id="edit_student_status_toggle"
                                    type="button"
                                    role="switch"
                                    aria-checked={editForm.is_active}
                                    onClick={() => updateEditField('is_active', !editForm.is_active)}
                                    className="inline-flex items-center gap-3 rounded-lg border border-none bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                                >
                                    <span
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                                            editForm.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                                                editForm.is_active ? 'translate-x-5' : 'translate-x-1'
                                            }`}
                                        />
                                    </span>
                                    <span className="font-medium">{editForm.is_active ? 'Active' : 'Inactive'}</span>
                                </button>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <Button type="submit"  disabled={savingEdit}>
                                    {savingEdit ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    {savingEdit ? 'Saving...' : 'Save Changes'}
                                </Button>
                                <DialogClose className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50">
                                    Cancel
                                </DialogClose>
                            </div>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
