import axios from 'axios';
import {
    ArrowLeft,
    ArrowRight,
    BookOpenText,
    ChevronDown,
    ChevronUp,
    GraduationCap,
    Loader2,
    Plus,
    Save,
    School,
    Trash2,
    Users,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { yearbookPalette as palette } from '@/lib/theme';

const EMPTY_YEARBOOK_FORM = {
    graduating_year: '',
    academic_year_text: '',
    hero_title: '',
    hero_description: '',
};

const EMPTY_DEPARTMENT_FORM = {
    label: '',
    full_name: '',
    description: '',
};

const EMPTY_FACULTY_FORM = {
    name: '',
    role: '',
    photo_upload: null,
};

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

function toYearbookDraft(yearbook) {
    return {
        graduating_year: String(yearbook.graduating_year ?? ''),
        academic_year_text: yearbook.academic_year_text ?? '',
        hero_title: yearbook.hero_title ?? '',
        hero_description: yearbook.hero_description ?? '',
    };
}

function toDepartmentDraft(department) {
    return {
        label: department.label ?? '',
        full_name: department.full_name ?? '',
        description: department.description ?? '',
    };
}

function toFacultyDraft(faculty) {
    return {
        name: faculty.name ?? '',
        role: faculty.role ?? '',
        photo_upload: null,
    };
}

function normalizeDepartmentGroupPhotoItems(department) {
    if (!department) {
        return [];
    }

    if (Array.isArray(department.group_photo_items) && department.group_photo_items.length > 0) {
        return department.group_photo_items
            .filter((item) => item && String(item.photo || '').trim() !== '')
            .map((item, index) => ({
                id: item.id ?? null,
                photo: item.photo,
                sort_order: item.sort_order ?? index + 1,
            }));
    }

    const fallbackPhotos = Array.isArray(department.group_photos)
        ? department.group_photos
        : department.group_photo
            ? [department.group_photo]
            : [];

    return fallbackPhotos
        .filter((photo) => String(photo || '').trim() !== '')
        .map((photo, index) => ({
            id: null,
            photo,
            sort_order: index + 1,
        }));
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

export default function AdminYearbooksPage() {
    const [yearbooks, setYearbooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [busyKey, setBusyKey] = useState('');

    const [createYearbookOpen, setCreateYearbookOpen] = useState(false);
    const [newYearbook, setNewYearbook] = useState(EMPTY_YEARBOOK_FORM);
    const [yearbookDrafts, setYearbookDrafts] = useState({});
    const [newDepartmentDrafts, setNewDepartmentDrafts] = useState({});
    const [departmentDrafts, setDepartmentDrafts] = useState({});
    const [newFacultyDrafts, setNewFacultyDrafts] = useState({});
    const [facultyDrafts, setFacultyDrafts] = useState({});

    const [activeYearbookId, setActiveYearbookId] = useState(null);
    const [activeDepartmentId, setActiveDepartmentId] = useState(null);

    const hydrateDrafts = useCallback((nextYearbooks) => {
        setYearbookDrafts(() => {
            const drafts = {};

            nextYearbooks.forEach((yearbook) => {
                drafts[yearbook.id] = toYearbookDraft(yearbook);
            });

            return drafts;
        });

        setDepartmentDrafts(() => {
            const drafts = {};

            nextYearbooks.forEach((yearbook) => {
                (yearbook.departments ?? []).forEach((department) => {
                    drafts[department.id] = toDepartmentDraft(department);
                });
            });

            return drafts;
        });

        setFacultyDrafts(() => {
            const drafts = {};

            nextYearbooks.forEach((yearbook) => {
                (yearbook.departments ?? []).forEach((department) => {
                    (department.faculty ?? []).forEach((member) => {
                        drafts[member.id] = toFacultyDraft(member);
                    });
                });
            });

            return drafts;
        });

        setNewDepartmentDrafts((current) => {
            const next = { ...current };

            nextYearbooks.forEach((yearbook) => {
                if (!next[yearbook.id]) {
                    next[yearbook.id] = { ...EMPTY_DEPARTMENT_FORM };
                }
            });

            return next;
        });

        setNewFacultyDrafts((current) => {
            const next = { ...current };

            nextYearbooks.forEach((yearbook) => {
                (yearbook.departments ?? []).forEach((department) => {
                    if (!next[department.id]) {
                        next[department.id] = { ...EMPTY_FACULTY_FORM };
                    }
                });
            });

            return next;
        });
    }, []);

    const loadYearbooks = useCallback(
        async ({ silent = false } = {}) => {
            if (!silent) {
                setLoading(true);
            }

            try {
                const response = await axios.get('/api/admin/yearbooks');
                const nextYearbooks = response.data.yearbooks ?? [];
                setYearbooks(nextYearbooks);
                hydrateDrafts(nextYearbooks);

                setActiveYearbookId((current) => {
                    if (!current) {
                        return null;
                    }

                    return nextYearbooks.some((yearbook) => yearbook.id === current) ? current : null;
                });
            } catch (requestError) {
                setError(firstApiError(requestError, 'Unable to load yearbooks.'));
            } finally {
                if (!silent) {
                    setLoading(false);
                }
            }
        },
        [hydrateDrafts],
    );

    useEffect(() => {
        loadYearbooks();
    }, [loadYearbooks]);

    const selectedYearbook = useMemo(
        () => yearbooks.find((yearbook) => yearbook.id === activeYearbookId) || null,
        [activeYearbookId, yearbooks],
    );

    useEffect(() => {
        if (!selectedYearbook) {
            setActiveDepartmentId(null);
            return;
        }

        const departments = selectedYearbook.departments ?? [];

        if (departments.length === 0) {
            setActiveDepartmentId(null);
            return;
        }

        if (!activeDepartmentId || !departments.some((department) => department.id === activeDepartmentId)) {
            setActiveDepartmentId(departments[0].id);
        }
    }, [activeDepartmentId, selectedYearbook]);

    const runMutation = useCallback(
        async (key, mutateFn, fallbackSuccessMessage, fallbackErrorMessage) => {
            setBusyKey(key);
            setError('');
            setNotice('');

            try {
                const response = await mutateFn();
                setNotice(response.data?.message || fallbackSuccessMessage);
                await loadYearbooks({ silent: true });
                return true;
            } catch (requestError) {
                setError(firstApiError(requestError, fallbackErrorMessage));
                return false;
            } finally {
                setBusyKey('');
            }
        },
        [loadYearbooks],
    );

    const updateYearbookDraftField = (yearbookId, field, value) => {
        setYearbookDrafts((current) => ({
            ...current,
            [yearbookId]: {
                ...(current[yearbookId] || { ...EMPTY_YEARBOOK_FORM }),
                [field]: value,
            },
        }));
    };

    const updateNewDepartmentField = (yearbookId, field, value) => {
        setNewDepartmentDrafts((current) => ({
            ...current,
            [yearbookId]: {
                ...(current[yearbookId] || { ...EMPTY_DEPARTMENT_FORM }),
                [field]: value,
            },
        }));
    };

    const updateDepartmentDraftField = (departmentId, field, value) => {
        setDepartmentDrafts((current) => ({
            ...current,
            [departmentId]: {
                ...(current[departmentId] || { ...EMPTY_DEPARTMENT_FORM }),
                [field]: value,
            },
        }));
    };

    const updateNewFacultyField = (departmentId, field, value) => {
        setNewFacultyDrafts((current) => ({
            ...current,
            [departmentId]: {
                ...(current[departmentId] || { ...EMPTY_FACULTY_FORM }),
                [field]: value,
            },
        }));
    };

    const updateFacultyDraftField = (facultyId, field, value) => {
        setFacultyDrafts((current) => ({
            ...current,
            [facultyId]: {
                ...(current[facultyId] || { ...EMPTY_FACULTY_FORM }),
                [field]: value,
            },
        }));
    };

    const handleCreateYearbook = async (event) => {
        event.preventDefault();

        const payload = {
            graduating_year: Number(newYearbook.graduating_year),
            academic_year_text: newYearbook.academic_year_text.trim(),
            hero_title: newYearbook.hero_title.trim(),
            hero_description: newYearbook.hero_description.trim(),
        };

        const success = await runMutation(
            'create-yearbook',
            () => axios.post('/api/admin/yearbooks', payload),
            'Yearbook created successfully.',
            'Unable to create yearbook.',
        );

        if (success) {
            setNewYearbook({ ...EMPTY_YEARBOOK_FORM });
            setCreateYearbookOpen(false);
        }
    };

    const handleUpdateYearbook = async (yearbookId) => {
        const draft = yearbookDrafts[yearbookId];

        if (!draft) {
            return;
        }

        const payload = {
            graduating_year: Number(draft.graduating_year),
            academic_year_text: draft.academic_year_text.trim(),
            hero_title: draft.hero_title.trim(),
            hero_description: draft.hero_description.trim(),
        };

        await runMutation(
            `update-yearbook-${yearbookId}`,
            () => axios.put(`/api/admin/yearbooks/${yearbookId}`, payload),
            'Yearbook updated successfully.',
            'Unable to update yearbook.',
        );
    };

    const handleDeleteYearbook = async (yearbookId) => {
        const allowed = window.confirm('Delete this yearbook? Departments and faculty under it will also be removed.');

        if (!allowed) {
            return;
        }

        const success = await runMutation(
            `delete-yearbook-${yearbookId}`,
            () => axios.delete(`/api/admin/yearbooks/${yearbookId}`),
            'Yearbook deleted successfully.',
            'Unable to delete yearbook.',
        );

        if (success && activeYearbookId === yearbookId) {
            setActiveYearbookId(null);
            setActiveDepartmentId(null);
        }
    };

    const handleCreateDepartment = async (yearbookId) => {
        const draft = newDepartmentDrafts[yearbookId] || { ...EMPTY_DEPARTMENT_FORM };

        const payload = {
            label: draft.label.trim(),
            full_name: draft.full_name.trim(),
            description: draft.description.trim(),
        };

        const success = await runMutation(
            `create-department-${yearbookId}`,
            () => axios.post(`/api/admin/yearbooks/${yearbookId}/departments`, payload),
            'Department created successfully.',
            'Unable to create department.',
        );

        if (success) {
            setNewDepartmentDrafts((current) => ({
                ...current,
                [yearbookId]: { ...EMPTY_DEPARTMENT_FORM },
            }));
        }
    };

    const handleUpdateDepartment = async (yearbookId, departmentId) => {
        const draft = departmentDrafts[departmentId];

        if (!draft) {
            return;
        }

        const payload = {
            label: draft.label.trim(),
            full_name: draft.full_name.trim(),
            description: draft.description.trim(),
        };

        await runMutation(
            `update-department-${departmentId}`,
            () => axios.put(`/api/admin/yearbooks/${yearbookId}/departments/${departmentId}`, payload),
            'Department updated successfully.',
            'Unable to update department.',
        );
    };

    const handleDeleteDepartment = async (yearbookId, departmentId) => {
        const allowed = window.confirm('Delete this department? Faculty under it will also be removed.');

        if (!allowed) {
            return;
        }

        const success = await runMutation(
            `delete-department-${departmentId}`,
            () => axios.delete(`/api/admin/yearbooks/${yearbookId}/departments/${departmentId}`),
            'Department deleted successfully.',
            'Unable to delete department.',
        );

        if (success && activeDepartmentId === departmentId) {
            setActiveDepartmentId(null);
        }
    };

    const handleDepartmentGroupPhotoUpload = async (departmentId, event) => {
        const files = Array.from(event.target.files || []);
        event.target.value = '';

        if (files.length === 0) {
            return;
        }

        const payload = new FormData();
        files.forEach((file) => {
            payload.append('department_group_photo_uploads[]', file);
        });

        await runMutation(
            `department-photos-upload-${departmentId}`,
            () => axios.post(`/api/admin/departments/${departmentId}/group-photos`, payload),
            'Department group photos updated successfully.',
            'Unable to upload department group photos.',
        );
    };

    const handleDepartmentGroupPhotoReorder = async (department, index, direction) => {
        const currentItems = normalizeDepartmentGroupPhotoItems(department);
        const targetIndex = index + direction;

        if (targetIndex < 0 || targetIndex >= currentItems.length) {
            return;
        }

        const nextItems = [...currentItems];
        const movedItem = nextItems[index];
        nextItems[index] = nextItems[targetIndex];
        nextItems[targetIndex] = movedItem;

        const nextIds = nextItems.map((item) => item.id);

        if (nextIds.some((id) => !id)) {
            return;
        }

        await runMutation(
            `department-photos-reorder-${department.id}`,
            () =>
                axios.patch(`/api/admin/departments/${department.id}/group-photos/reorder`, {
                    photo_ids: nextIds,
                }),
            'Department group photo sequence updated.',
            'Unable to reorder department group photos.',
        );
    };

    const handleDepartmentGroupPhotoDelete = async (department, photoItem) => {
        if (!photoItem?.id) {
            return;
        }

        await runMutation(
            `department-photos-delete-${photoItem.id}`,
            () => axios.delete(`/api/admin/departments/${department.id}/group-photos/${photoItem.id}`),
            'Department group photo removed.',
            'Unable to remove department group photo.',
        );
    };

    const handleCreateFaculty = async (departmentId) => {
        const draft = newFacultyDrafts[departmentId] || { ...EMPTY_FACULTY_FORM };

        const payload = new FormData();
        payload.append('name', draft.name.trim());
        payload.append('role', draft.role.trim());

        if (draft.photo_upload) {
            payload.append('photo_upload', draft.photo_upload);
        }

        const success = await runMutation(
            `create-faculty-${departmentId}`,
            () => axios.post(`/api/admin/departments/${departmentId}/faculty`, payload),
            'Faculty member created successfully.',
            'Unable to create faculty member.',
        );

        if (success) {
            setNewFacultyDrafts((current) => ({
                ...current,
                [departmentId]: { ...EMPTY_FACULTY_FORM },
            }));
        }
    };

    const handleUpdateFaculty = async (departmentId, facultyId) => {
        const draft = facultyDrafts[facultyId];

        if (!draft) {
            return;
        }

        const payload = new FormData();
        payload.append('_method', 'PUT');
        payload.append('name', draft.name.trim());
        payload.append('role', draft.role.trim());

        if (draft.photo_upload) {
            payload.append('photo_upload', draft.photo_upload);
        }

        await runMutation(
            `update-faculty-${facultyId}`,
            () => axios.post(`/api/admin/departments/${departmentId}/faculty/${facultyId}`, payload),
            'Faculty member updated successfully.',
            'Unable to update faculty member.',
        );
    };

    const handleDeleteFaculty = async (departmentId, facultyId) => {
        const allowed = window.confirm('Delete this faculty member?');

        if (!allowed) {
            return;
        }

        await runMutation(
            `delete-faculty-${facultyId}`,
            () => axios.delete(`/api/admin/departments/${departmentId}/faculty/${facultyId}`),
            'Faculty member deleted successfully.',
            'Unable to delete faculty member.',
        );
    };

    if (loading) {
        return <p className="text-sm text-slate-500">Loading yearbook management...</p>;
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
                        <h1 className="mt-3 text-3xl font-bold text-slate-900">Yearbooks</h1>
                        <p className="mt-2 text-sm text-slate-500">
                            Manage yearbook records first, then select one to edit details, departments, and faculty.
                        </p>
                    </div>

                    <Button type="button" onClick={() => setCreateYearbookOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Yearbook
                    </Button>
                </div>
            </section>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {notice ? <p className="text-sm text-emerald-600">{notice}</p> : null}

            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-slate-900">Yearbook List</h2>
                    <span className="text-xs text-slate-500">{yearbooks.length} total</span>
                </div>

                {yearbooks.length === 0 ? (
                    <p className="text-sm text-slate-500">No yearbooks yet. Use “Create Yearbook” to add one.</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Year</TableHead>
                                <TableHead>Academic Year</TableHead>
                                <TableHead>Programs</TableHead>
                                <TableHead>Faculty</TableHead>
                                <TableHead>Graduates</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {yearbooks.map((yearbook) => {
                                const isSelected = activeYearbookId === yearbook.id;

                                return (
                                    <TableRow
                                        key={yearbook.id}
                                        className={isSelected ? 'bg-slate-50/70' : undefined}
                                    >
                                        <TableCell className="font-semibold text-slate-900">
                                            {yearbook.graduating_year}
                                        </TableCell>
                                        <TableCell>{yearbook.academic_year_text}</TableCell>
                                        <TableCell>{yearbook.programs_count}</TableCell>
                                        <TableCell>{yearbook.faculty_count}</TableCell>
                                        <TableCell>{yearbook.graduates_count}</TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    type="button"
                                                    variant={isSelected ? 'secondary' : 'outline'}
                                                    size="sm"
                                                    onClick={() => setActiveYearbookId(yearbook.id)}
                                                >
                                                    {isSelected ? 'Selected' : 'Select'}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleDeleteYearbook(yearbook.id)}
                                                    disabled={busyKey === `delete-yearbook-${yearbook.id}`}
                                                >
                                                    {busyKey === `delete-yearbook-${yearbook.id}` ? 'Deleting...' : 'Delete'}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </section>

            {!selectedYearbook ? (
                <section className="rounded-2xl bg-white p-10 shadow-sm ring-1 ring-slate-900/5">
                    <div className="mx-auto max-w-lg text-center">
                        <div
                            className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl"
                            style={{ background: `${palette.navy}16`, color: palette.navy }}
                        >
                            <BookOpenText className="h-6 w-6" />
                        </div>
                        <h2 className="mt-4 text-xl font-semibold text-slate-900">Select a Yearbook</h2>
                        <p className="mt-2 text-sm text-slate-500">
                            Yearbook details and management tools appear here after you select one row from the table above.
                        </p>
                    </div>
                </section>
            ) : (
                <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p
                                className="text-xs uppercase tracking-[0.15em]"
                                style={{ fontFamily: "'Helvetica Neue', sans-serif", color: palette.red }}
                            >
                                Yearbook Details
                            </p>
                            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                                {selectedYearbook.school_name} • Class of {selectedYearbook.graduating_year}
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">{selectedYearbook.academic_year_text}</p>
                        </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <MetricCard
                            label="Graduates"
                            value={selectedYearbook.graduates_count}
                            icon={GraduationCap}
                            accent={palette.navy}
                        />
                        <MetricCard
                            label="Programs"
                            value={selectedYearbook.programs_count}
                            icon={School}
                            accent={palette.goldDark}
                        />
                        <MetricCard
                            label="Faculty"
                            value={selectedYearbook.faculty_count}
                            icon={Users}
                            accent={palette.red}
                        />
                    </div>

                    <div className="mt-6 space-y-6 border-t border-slate-200 pt-6">
                        <section className="space-y-4">
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-lg font-semibold text-slate-900">Yearbook Fields</h3>
                                <Button
                                    type="button"
                                    onClick={() => handleUpdateYearbook(selectedYearbook.id)}
                                    disabled={busyKey === `update-yearbook-${selectedYearbook.id}`}
                                >
                                    <Save className="mr-2 h-4 w-4" />
                                    {busyKey === `update-yearbook-${selectedYearbook.id}` ? 'Saving...' : 'Save'}
                                </Button>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Graduating Year</Label>
                                    <Input
                                        type="number"
                                        min="1900"
                                        max="2100"
                                        value={(yearbookDrafts[selectedYearbook.id] || toYearbookDraft(selectedYearbook)).graduating_year}
                                        onChange={(event) => updateYearbookDraftField(selectedYearbook.id, 'graduating_year', event.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Academic Year Text</Label>
                                    <Input
                                        value={(yearbookDrafts[selectedYearbook.id] || toYearbookDraft(selectedYearbook)).academic_year_text}
                                        onChange={(event) => updateYearbookDraftField(selectedYearbook.id, 'academic_year_text', event.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Hero Title</Label>
                                    <Input
                                        value={(yearbookDrafts[selectedYearbook.id] || toYearbookDraft(selectedYearbook)).hero_title}
                                        onChange={(event) => updateYearbookDraftField(selectedYearbook.id, 'hero_title', event.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Hero Description</Label>
                                    <Textarea
                                        rows={3}
                                        value={(yearbookDrafts[selectedYearbook.id] || toYearbookDraft(selectedYearbook)).hero_description}
                                        onChange={(event) => updateYearbookDraftField(selectedYearbook.id, 'hero_description', event.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4 border-t border-slate-200 pt-6">
                            <h3 className="text-lg font-semibold text-slate-900">Departments</h3>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Create Department</p>
                                <div className="mt-3 grid gap-3 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Label</Label>
                                        <Input
                                            value={(newDepartmentDrafts[selectedYearbook.id] || { ...EMPTY_DEPARTMENT_FORM }).label}
                                            onChange={(event) => updateNewDepartmentField(selectedYearbook.id, 'label', event.target.value)}
                                            placeholder="BSCS"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Full Name</Label>
                                        <Input
                                            value={(newDepartmentDrafts[selectedYearbook.id] || { ...EMPTY_DEPARTMENT_FORM }).full_name}
                                            onChange={(event) => updateNewDepartmentField(selectedYearbook.id, 'full_name', event.target.value)}
                                            placeholder="Bachelor of Science in Computer Science"
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label>Description</Label>
                                        <Textarea
                                            rows={2}
                                            value={(newDepartmentDrafts[selectedYearbook.id] || { ...EMPTY_DEPARTMENT_FORM }).description}
                                            onChange={(event) => updateNewDepartmentField(selectedYearbook.id, 'description', event.target.value)}
                                            placeholder="Program description"
                                        />
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    className="mt-4"
                                    onClick={() => handleCreateDepartment(selectedYearbook.id)}
                                    disabled={busyKey === `create-department-${selectedYearbook.id}`}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    {busyKey === `create-department-${selectedYearbook.id}` ? 'Creating...' : 'Add Department'}
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {(selectedYearbook.departments ?? []).map((department) => {
                                    const departmentDraft = departmentDrafts[department.id] || toDepartmentDraft(department);
                                    const newFacultyDraft = newFacultyDrafts[department.id] || { ...EMPTY_FACULTY_FORM };
                                    const isActiveDepartment = activeDepartmentId === department.id;
                                    const groupPhotoItems = normalizeDepartmentGroupPhotoItems(department);
                                    const isGroupPhotoBusy = busyKey.startsWith('department-photos-');
                                    const isGroupPhotoUploadBusy = busyKey === `department-photos-upload-${department.id}`;

                                    return (
                                        <article key={department.id} className="rounded-xl border border-slate-200 p-4">
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div>
                                                    <h4 className="text-base font-semibold text-slate-900">
                                                        {department.label} • {department.full_name}
                                                    </h4>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        {department.students_count} students • {department.faculty_count} faculty
                                                    </p>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setActiveDepartmentId((current) => (current === department.id ? null : department.id))}
                                                >
                                                    {isActiveDepartment ? (
                                                        <>
                                                            <ChevronUp className="mr-2 h-4 w-4" />
                                                            Hide Faculty
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ChevronDown className="mr-2 h-4 w-4" />
                                                            Manage Faculty
                                                        </>
                                                    )}
                                                </Button>
                                            </div>

                                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label>Label</Label>
                                                    <Input
                                                        value={departmentDraft.label}
                                                        onChange={(event) => updateDepartmentDraftField(department.id, 'label', event.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Full Name</Label>
                                                    <Input
                                                        value={departmentDraft.full_name}
                                                        onChange={(event) => updateDepartmentDraftField(department.id, 'full_name', event.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2 md:col-span-2">
                                                    <Label>Description</Label>
                                                    <Textarea
                                                        rows={2}
                                                        value={departmentDraft.description}
                                                        onChange={(event) => updateDepartmentDraftField(department.id, 'description', event.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="mt-4 flex items-center gap-2">
                                                <Button
                                                    type="button"
                                                    onClick={() => handleUpdateDepartment(selectedYearbook.id, department.id)}
                                                    disabled={busyKey === `update-department-${department.id}`}
                                                >
                                                    <Save className="mr-2 h-4 w-4" />
                                                    {busyKey === `update-department-${department.id}` ? 'Saving...' : 'Save Department'}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    onClick={() => handleDeleteDepartment(selectedYearbook.id, department.id)}
                                                    disabled={busyKey === `delete-department-${department.id}`}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    {busyKey === `delete-department-${department.id}` ? 'Deleting...' : 'Delete'}
                                                </Button>
                                            </div>

                                            <div className="mt-4 space-y-2">
                                                <Label htmlFor={`department_group_photo_upload_${department.id}`}>Department Group Photos</Label>
                                                <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                                                    {groupPhotoItems.length > 0 ? (
                                                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                                            {groupPhotoItems.map((photoItem, index) => (
                                                                <div key={`${photoItem.id || photoItem.photo}-${index}`} className="space-y-2">
                                                                    <div className="relative overflow-hidden rounded-lg ring-1 ring-slate-200">
                                                                        <img
                                                                            src={photoItem.photo}
                                                                            alt={`Department group photo ${index + 1}`}
                                                                            className="h-36 w-full object-cover sm:h-40"
                                                                            onError={(event) => {
                                                                                event.currentTarget.onerror = null;
                                                                                event.currentTarget.src =
                                                                                    'https://via.placeholder.com/640x360?text=Department+Group+Photo';
                                                                            }}
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleDepartmentGroupPhotoDelete(department, photoItem)}
                                                                            disabled={isGroupPhotoBusy || !photoItem.id}
                                                                            className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black disabled:opacity-50"
                                                                            aria-label={`Remove group photo ${index + 1}`}
                                                                            title="Remove photo"
                                                                        >
                                                                            <X className="h-4 w-4" />
                                                                        </button>
                                                                    </div>

                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <span className="text-xs text-slate-500">#{index + 1}</span>
                                                                        <div className="flex items-center gap-1">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleDepartmentGroupPhotoReorder(department, index, -1)}
                                                                                disabled={isGroupPhotoBusy || index === 0 || !photoItem.id}
                                                                                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 disabled:opacity-50"
                                                                                aria-label={`Move photo ${index + 1} left`}
                                                                                title="Move earlier"
                                                                            >
                                                                                <ArrowLeft className="h-4 w-4" />
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleDepartmentGroupPhotoReorder(department, index, 1)}
                                                                                disabled={isGroupPhotoBusy || index === groupPhotoItems.length - 1 || !photoItem.id}
                                                                                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 disabled:opacity-50"
                                                                                aria-label={`Move photo ${index + 1} right`}
                                                                                title="Move later"
                                                                            >
                                                                                <ArrowRight className="h-4 w-4" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="flex h-32 items-center justify-center rounded-lg bg-white text-xs text-slate-500 ring-1 ring-slate-200 sm:h-40">
                                                            No department group photo uploaded yet.
                                                        </div>
                                                    )}

                                                    <div className="space-y-2">
                                                        <Input
                                                            id={`department_group_photo_upload_${department.id}`}
                                                            type="file"
                                                            accept="image/*"
                                                            multiple
                                                            onChange={(event) => handleDepartmentGroupPhotoUpload(department.id, event)}
                                                            disabled={isGroupPhotoBusy}
                                                            className="cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white disabled:cursor-not-allowed"
                                                        />
                                                        <p className="text-xs text-slate-500">
                                                            New uploads append automatically. Reorder with arrows. Remove only via the X button on each image.
                                                        </p>
                                                        {isGroupPhotoUploadBusy ? (
                                                            <p className="inline-flex items-center gap-2 text-xs text-slate-600">
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                Uploading department photos...
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>

                                            {isActiveDepartment ? (
                                                <div className="mt-5 space-y-4 border-t border-slate-200 pt-5">
                                                    <h5 className="text-sm font-semibold text-slate-900">Faculty</h5>

                                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                                        <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Add Faculty</p>
                                                        <div className="mt-3 grid gap-3 md:grid-cols-3">
                                                            <div className="space-y-2">
                                                                <Label>Name</Label>
                                                                <Input
                                                                    value={newFacultyDraft.name}
                                                                    onChange={(event) => updateNewFacultyField(department.id, 'name', event.target.value)}
                                                                    placeholder="Dr. Maria Santos"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label>Role</Label>
                                                                <Input
                                                                    value={newFacultyDraft.role}
                                                                    onChange={(event) => updateNewFacultyField(department.id, 'role', event.target.value)}
                                                                    placeholder="Program Chair"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label>Faculty Image</Label>
                                                                <Input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    onChange={(event) => updateNewFacultyField(department.id, 'photo_upload', event.target.files?.[0] || null)}
                                                                    className="cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
                                                                />
                                                                <p className="text-[11px] text-slate-500">
                                                                    Upload JPG/PNG/WebP (max 4MB).
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            className="mt-3"
                                                            onClick={() => handleCreateFaculty(department.id)}
                                                            disabled={busyKey === `create-faculty-${department.id}`}
                                                        >
                                                            <Plus className="mr-2 h-4 w-4" />
                                                            {busyKey === `create-faculty-${department.id}` ? 'Creating...' : 'Add Faculty'}
                                                        </Button>
                                                    </div>

                                                    <div className="space-y-3">
                                                        {(department.faculty ?? []).length === 0 ? (
                                                            <p className="text-xs text-slate-500">No faculty members yet.</p>
                                                        ) : null}

                                                        {(department.faculty ?? []).map((member) => {
                                                            const facultyDraft = facultyDrafts[member.id] || toFacultyDraft(member);

                                                            return (
                                                                <div key={member.id} className="rounded-lg border border-slate-200 p-3">
                                                                    <div className="grid gap-3 md:grid-cols-3">
                                                                        <div className="space-y-2">
                                                                            <Label>Name</Label>
                                                                            <Input
                                                                                value={facultyDraft.name}
                                                                                onChange={(event) => updateFacultyDraftField(member.id, 'name', event.target.value)}
                                                                            />
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <Label>Role</Label>
                                                                            <Input
                                                                                value={facultyDraft.role}
                                                                                onChange={(event) => updateFacultyDraftField(member.id, 'role', event.target.value)}
                                                                            />
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <Label>Replace Image (Optional)</Label>
                                                                            <Input
                                                                                type="file"
                                                                                accept="image/*"
                                                                                onChange={(event) => updateFacultyDraftField(member.id, 'photo_upload', event.target.files?.[0] || null)}
                                                                                className="cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
                                                                            />
                                                                            <p className="text-[11px] text-slate-500">
                                                                                Leave empty to keep current image.
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    {member.photo ? (
                                                                        <div className="mt-3">
                                                                            <img
                                                                                src={member.photo}
                                                                                alt={member.name}
                                                                                className="h-16 w-16 rounded-lg object-cover ring-1 ring-slate-200"
                                                                            />
                                                                        </div>
                                                                    ) : null}
                                                                    <div className="mt-3 flex items-center gap-2">
                                                                        <Button
                                                                            type="button"
                                                                            onClick={() => handleUpdateFaculty(department.id, member.id)}
                                                                            disabled={busyKey === `update-faculty-${member.id}`}
                                                                        >
                                                                            <Save className="mr-2 h-4 w-4" />
                                                                            {busyKey === `update-faculty-${member.id}` ? 'Saving...' : 'Save'}
                                                                        </Button>
                                                                        <Button
                                                                            type="button"
                                                                            variant="destructive"
                                                                            onClick={() => handleDeleteFaculty(department.id, member.id)}
                                                                            disabled={busyKey === `delete-faculty-${member.id}`}
                                                                        >
                                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                                            {busyKey === `delete-faculty-${member.id}` ? 'Deleting...' : 'Delete'}
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ) : null}
                                        </article>
                                    );
                                })}
                            </div>
                        </section>
                    </div>
                </section>
            )}

            <Dialog open={createYearbookOpen} onOpenChange={setCreateYearbookOpen}>
                <DialogContent className="flex items-center justify-center p-4">
                    <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10">
                        <div className="mb-4 flex items-start justify-between gap-3">
                            <div>
                                <p
                                    className="text-xs uppercase tracking-[0.15em]"
                                    style={{ fontFamily: "'Helvetica Neue', sans-serif", color: palette.red }}
                                >
                                    New Yearbook
                                </p>
                                <h3 className="mt-1 text-xl font-semibold text-slate-900">Create Yearbook</h3>
                            </div>
                            <DialogClose className="h-9 w-9 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
                                <X className="mx-auto h-4 w-4" />
                            </DialogClose>
                        </div>

                        <form onSubmit={handleCreateYearbook} className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="create_yearbook_graduating_year">Graduating Year</Label>
                                <Input
                                    id="create_yearbook_graduating_year"
                                    type="number"
                                    min="1900"
                                    max="2100"
                                    value={newYearbook.graduating_year}
                                    onChange={(event) => setNewYearbook((current) => ({ ...current, graduating_year: event.target.value }))}
                                    placeholder="2026"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="create_yearbook_academic_year_text">Academic Year Text</Label>
                                <Input
                                    id="create_yearbook_academic_year_text"
                                    value={newYearbook.academic_year_text}
                                    onChange={(event) => setNewYearbook((current) => ({ ...current, academic_year_text: event.target.value }))}
                                    placeholder="Academic Year 2025 - 2026"
                                    required
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="create_yearbook_hero_title">Hero Title</Label>
                                <Input
                                    id="create_yearbook_hero_title"
                                    value={newYearbook.hero_title}
                                    onChange={(event) => setNewYearbook((current) => ({ ...current, hero_title: event.target.value }))}
                                    placeholder="Celebrating the Class of 2026"
                                    required
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="create_yearbook_hero_description">Hero Description</Label>
                                <Textarea
                                    id="create_yearbook_hero_description"
                                    rows={3}
                                    value={newYearbook.hero_description}
                                    onChange={(event) => setNewYearbook((current) => ({ ...current, hero_description: event.target.value }))}
                                    placeholder="Write the yearbook hero description."
                                    required
                                />
                            </div>

                            <div className="md:col-span-2 flex items-center gap-2">
                                <Button type="submit" disabled={busyKey === 'create-yearbook'}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    {busyKey === 'create-yearbook' ? 'Creating...' : 'Create Yearbook'}
                                </Button>
                                <DialogClose className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50">
                                    Cancel
                                </DialogClose>
                            </div>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>

            {busyKey !== '' ? (
                <div className="fixed bottom-6 right-6 rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-lg">
                    Processing...
                </div>
            ) : null}
        </div>
    );
}
