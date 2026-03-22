import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import RegistrationTypeSelector from '@/components/registration/RegistrationTypeSelector';
import { registrationTypeMeta } from '@/lib/registrationLinkTypes';

const defaultValues = {
    title: '',
    type: 'free_year_free_department',
    yearbook_id: '',
    department_id: '',
    starts_at: '',
    ends_at: '',
    is_active: true,
    description: '',
};

function isoToLocalInput(isoValue) {
    if (!isoValue) {
        return '';
    }

    const dateValue = new Date(isoValue);

    if (Number.isNaN(dateValue.getTime())) {
        return '';
    }

    const timezoneOffset = dateValue.getTimezoneOffset() * 60_000;
    const localValue = new Date(dateValue.getTime() - timezoneOffset);

    return localValue.toISOString().slice(0, 16);
}

function localInputToIso(localValue) {
    if (!localValue) {
        return null;
    }

    const parsed = new Date(localValue);

    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    return parsed.toISOString();
}

export default function RegistrationLinkForm({
    initialValues,
    options,
    onSubmit,
    submitting = false,
    errorMessage = '',
    submitLabel = 'Save',
}) {
    const [form, setForm] = useState(defaultValues);

    useEffect(() => {
        setForm({
            title: initialValues?.title ?? '',
            type: initialValues?.type ?? 'free_year_free_department',
            yearbook_id: initialValues?.yearbook?.id ? String(initialValues.yearbook.id) : '',
            department_id: initialValues?.department?.id ? String(initialValues.department.id) : '',
            starts_at: isoToLocalInput(initialValues?.starts_at),
            ends_at: isoToLocalInput(initialValues?.ends_at),
            is_active: typeof initialValues?.is_active === 'boolean' ? initialValues.is_active : true,
            description: initialValues?.description ?? '',
        });
    }, [initialValues]);

    const typeMeta = registrationTypeMeta(form.type);
    const yearbooks = Array.isArray(options?.yearbooks) ? options.yearbooks : [];
    const departments = Array.isArray(options?.departments) ? options.departments : [];
    const typeOptions = Array.isArray(options?.types) ? options.types : [];

    const filteredDepartmentOptions = useMemo(() => {
        if (!typeMeta.allowsDepartmentSelection && !typeMeta.requiresFixedDepartment) {
            return [];
        }

        if (typeMeta.requiresFixedYear && form.yearbook_id) {
            return departments.filter(
                (department) => String(department.yearbook_id) === String(form.yearbook_id),
            );
        }

        if (typeMeta.allowsDepartmentSelection && form.yearbook_id) {
            return departments.filter(
                (department) => String(department.yearbook_id) === String(form.yearbook_id),
            );
        }

        return departments;
    }, [departments, form.yearbook_id, typeMeta]);

    const handleChange = (field) => (event) => {
        const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;

        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const handleTypeChange = (nextType) => {
        const nextMeta = registrationTypeMeta(nextType);

        setForm((current) => ({
            ...current,
            type: nextType,
            yearbook_id: nextMeta.requiresFixedYear ? current.yearbook_id : '',
            department_id: nextMeta.requiresFixedDepartment ? current.department_id : '',
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        await onSubmit({
            title: form.title,
            type: form.type,
            yearbook_id:
                typeMeta.requiresFixedYear && form.yearbook_id !== ''
                    ? Number(form.yearbook_id)
                    : null,
            department_id:
                typeMeta.requiresFixedDepartment && form.department_id !== ''
                    ? Number(form.department_id)
                    : null,
            starts_at: localInputToIso(form.starts_at),
            ends_at: localInputToIso(form.ends_at),
            is_active: Boolean(form.is_active),
            description: form.description || null,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="registration_link_title">Title</Label>
                    <Input
                        id="registration_link_title"
                        value={form.title}
                        onChange={handleChange('title')}
                        placeholder="Example: Batch 2025 BSCS Registration"
                        required
                    />
                </div>

                <RegistrationTypeSelector
                    value={form.type}
                    onChange={handleTypeChange}
                    options={typeOptions}
                />

                <div className="space-y-2">
                    <Label htmlFor="registration_link_active">Status</Label>
                    <label
                        htmlFor="registration_link_active"
                        className="flex h-11 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-3"
                    >
                        <input
                            id="registration_link_active"
                            type="checkbox"
                            checked={form.is_active}
                            onChange={handleChange('is_active')}
                            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                        />
                        <span className="text-sm text-slate-700">Enable this registration link</span>
                    </label>
                </div>

                {typeMeta.requiresFixedYear ? (
                    <div className="space-y-2">
                        <Label htmlFor="registration_link_yearbook">Fixed Year</Label>
                        <select
                            id="registration_link_yearbook"
                            value={form.yearbook_id}
                            onChange={handleChange('yearbook_id')}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[#1a2a6c] focus:ring-2 focus:ring-[#1a2a6c]/30"
                            required
                        >
                            <option value="">Select year</option>
                            {yearbooks.map((yearbook) => (
                                <option key={yearbook.id} value={yearbook.id}>
                                    {yearbook.graduating_year}
                                </option>
                            ))}
                        </select>
                    </div>
                ) : null}

                {typeMeta.requiresFixedDepartment ? (
                    <div className="space-y-2">
                        <Label htmlFor="registration_link_department">Fixed Department</Label>
                        <select
                            id="registration_link_department"
                            value={form.department_id}
                            onChange={handleChange('department_id')}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[#1a2a6c] focus:ring-2 focus:ring-[#1a2a6c]/30"
                            required
                        >
                            <option value="">Select department</option>
                            {filteredDepartmentOptions.map((department) => (
                                <option key={department.id} value={department.id}>
                                    {department.label} - {department.full_name} ({department.graduating_year ?? '-'})
                                </option>
                            ))}
                        </select>
                    </div>
                ) : null}

                <div className="space-y-2">
                    <Label htmlFor="registration_link_starts_at">Start Date/Time</Label>
                    <Input
                        id="registration_link_starts_at"
                        type="datetime-local"
                        value={form.starts_at}
                        onChange={handleChange('starts_at')}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="registration_link_ends_at">End Date/Time</Label>
                    <Input
                        id="registration_link_ends_at"
                        type="datetime-local"
                        value={form.ends_at}
                        onChange={handleChange('ends_at')}
                    />
                </div>

                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="registration_link_description">Description / Notes</Label>
                    <Textarea
                        id="registration_link_description"
                        rows={3}
                        value={form.description}
                        onChange={handleChange('description')}
                        placeholder="Optional notes for administrators."
                    />
                </div>
            </div>

            {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

            <div className="flex items-center gap-3">
                <Button type="submit" disabled={submitting}>
                    {submitting ? 'Saving...' : submitLabel}
                </Button>
            </div>
        </form>
    );
}
