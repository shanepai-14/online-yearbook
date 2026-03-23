import axios from 'axios';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import RegistrationAvailabilityNotice from '@/components/registration/RegistrationAvailabilityNotice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { STUDENT_GENDER_OPTIONS } from '@/lib/placeholders';
import { yearbookPalette as palette } from '@/lib/theme';

const initialForm = {
    name: '',
    gender: '',
    email: '',
    password: '',
    password_confirmation: '',
    motto: '',
    badge: '',
    photo: '',
    photo_upload: null,
    yearbook_id: '',
    department_id: '',
};

export default function RegisterByLinkPage() {
    const { token } = useParams();
    const navigate = useNavigate();
    const { login } = useAuth();

    const [form, setForm] = useState(initialForm);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [submitError, setSubmitError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [registrationLink, setRegistrationLink] = useState(null);
    const [options, setOptions] = useState({ yearbooks: [], departments: [] });

    useEffect(() => {
        let cancelled = false;

        const loadRegistrationLink = async () => {
            setLoading(true);
            setError('');
            setSuccessMessage('');
            setSubmitError('');

            try {
                const response = await axios.get(`/api/registration-links/${token}`);

                if (cancelled) {
                    return;
                }

                const link = response.data.registration_link ?? null;
                const nextOptions = response.data.options ?? { yearbooks: [], departments: [] };

                setRegistrationLink(link);
                setOptions(nextOptions);
                setForm((current) => ({
                    ...current,
                    yearbook_id: link?.fixed_yearbook?.id ? String(link.fixed_yearbook.id) : '',
                    department_id: link?.fixed_department?.id ? String(link.fixed_department.id) : '',
                }));
            } catch (requestError) {
                if (cancelled) {
                    return;
                }

                setError(requestError.response?.data?.message || 'Invalid registration link.');
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadRegistrationLink();

        return () => {
            cancelled = true;
        };
    }, [token]);

    const yearbooks = Array.isArray(options?.yearbooks) ? options.yearbooks : [];
    const departments = Array.isArray(options?.departments) ? options.departments : [];

    const filteredDepartments = useMemo(() => {
        if (!registrationLink?.allows_department_selection) {
            return [];
        }

        if (!form.yearbook_id) {
            return departments;
        }

        return departments.filter(
            (department) => String(department.yearbook_id) === String(form.yearbook_id),
        );
    }, [departments, form.yearbook_id, registrationLink?.allows_department_selection]);

    useEffect(() => {
        if (!registrationLink?.allows_department_selection || !form.department_id) {
            return;
        }

        const isStillValid = filteredDepartments.some(
            (department) => String(department.id) === String(form.department_id),
        );

        if (!isStillValid) {
            setForm((current) => ({ ...current, department_id: '' }));
        }
    }, [filteredDepartments, form.department_id, registrationLink?.allows_department_selection]);

    const handleChange = (field) => (event) => {
        setForm((current) => ({
            ...current,
            [field]: event.target.value,
        }));
    };

    const handleFileChange = (event) => {
        const file = event.target.files?.[0] ?? null;

        setForm((current) => ({
            ...current,
            photo_upload: file,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitError('');
        setSuccessMessage('');
        setSubmitting(true);

        const payload = new FormData();
        payload.append('name', form.name);
        payload.append('gender', form.gender);
        payload.append('email', form.email);
        payload.append('password', form.password);
        payload.append('password_confirmation', form.password_confirmation);

        if (form.motto.trim() !== '') {
            payload.append('motto', form.motto.trim());
        }

        if (form.badge.trim() !== '') {
            payload.append('badge', form.badge.trim());
        }

        if (registrationLink?.allows_year_selection) {
            payload.append('yearbook_id', form.yearbook_id);
        }

        if (registrationLink?.allows_department_selection) {
            payload.append('department_id', form.department_id);
        }

        if (form.photo_upload) {
            payload.append('photo_upload', form.photo_upload);
        } else if (form.photo.trim() !== '') {
            payload.append('photo', form.photo.trim());
        }

        try {
            const response = await axios.post(`/api/register/${token}`, payload, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            await login({
                email: form.email,
                password: form.password,
            });

            setSuccessMessage(response.data.message || 'Registration completed successfully.');
            navigate('/student', { replace: true });
        } catch (requestError) {
            const details = requestError.response?.data?.errors;

            if (details && typeof details === 'object') {
                const firstField = Object.keys(details)[0];
                const firstError = details[firstField]?.[0];
                setSubmitError(firstError || 'Unable to complete registration.');
            } else {
                setSubmitError(requestError.response?.data?.message || 'Unable to complete registration.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center px-4">
                <p className="inline-flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading registration link...
                </p>
            </div>
        );
    }

    if (error || !registrationLink) {
        return (
            <div className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4">
                <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Registration Link Unavailable</h1>
                    <p className="mt-3 text-sm text-slate-600">{error || 'This registration link is invalid.'}</p>
                    <Button asChild className="mt-6">
                        <Link to="/yearbook">Back to Home</Link>
                    </Button>
                </div>
            </div>
        );
    }

    const isUnavailable = !registrationLink.is_available;

    return (
        <div className="min-h-screen px-4 py-8" style={{ background: palette.lightBg }}>
            <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1.05fr,1fr]">
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                    <p
                        className="text-xs uppercase tracking-[0.2em]"
                        style={{ fontFamily: "'Helvetica Neue', sans-serif", color: palette.red }}
                    >
                        Student Registration
                    </p>
                    <h1 className="mt-3 text-3xl font-bold text-slate-900">{registrationLink.title}</h1>
                    <p className="mt-2 text-sm text-slate-500">{registrationLink.type_label}</p>
                    {registrationLink.description ? (
                        <p className="mt-4 text-sm leading-relaxed text-slate-600">{registrationLink.description}</p>
                    ) : null}

                    <div className="mt-6">
                        <RegistrationAvailabilityNotice
                            status={registrationLink.status}
                            message={registrationLink.availability_message}
                        />
                    </div>

                    <div className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Registration Context</p>
                        <div className="space-y-2 text-sm text-slate-700">
                            <p>
                                <span className="font-medium">Year:</span>{' '}
                                {registrationLink.fixed_yearbook?.graduating_year || 'Selectable'}
                            </p>
                            <p>
                                <span className="font-medium">Department:</span>{' '}
                                {registrationLink.fixed_department?.label || 'Selectable'}
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <Button asChild variant="outline">
                            <Link to="/yearbook/login">Go to Login</Link>
                        </Button>
                        <Button asChild variant="ghost">
                            <Link to="/yearbook">Back to Home</Link>
                        </Button>
                    </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                    <div className="mb-5 flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5" style={{ color: palette.navy }} />
                        <h2 className="text-xl font-semibold text-slate-900">Complete Registration</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="register_name">Name</Label>
                            <Input
                                id="register_name"
                                value={form.name}
                                onChange={handleChange('name')}
                                placeholder="Your full name"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="register_gender">Gender</Label>
                            <select
                                id="register_gender"
                                value={form.gender}
                                onChange={handleChange('gender')}
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[#1a2a6c] focus:ring-2 focus:ring-[#1a2a6c]/30"
                                required
                            >
                                <option value="">Select gender</option>
                                {STUDENT_GENDER_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="register_email">Email</Label>
                            <Input
                                id="register_email"
                                type="email"
                                value={form.email}
                                onChange={handleChange('email')}
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="register_password">Password</Label>
                                <Input
                                    id="register_password"
                                    type="password"
                                    value={form.password}
                                    onChange={handleChange('password')}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="register_password_confirmation">Confirm Password</Label>
                                <Input
                                    id="register_password_confirmation"
                                    type="password"
                                    value={form.password_confirmation}
                                    onChange={handleChange('password_confirmation')}
                                    required
                                />
                            </div>
                        </div>

                        {registrationLink.allows_year_selection ? (
                            <div className="space-y-2">
                                <Label htmlFor="register_yearbook">Year</Label>
                                <select
                                    id="register_yearbook"
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
                        ) : (
                            <div className="space-y-2">
                                <Label>Year</Label>
                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                                    {registrationLink.fixed_yearbook
                                        ? `${registrationLink.fixed_yearbook.graduating_year} (${registrationLink.fixed_yearbook.academic_year_text || 'Fixed'})`
                                        : 'Not set'}
                                </div>
                            </div>
                        )}

                        {registrationLink.allows_department_selection ? (
                            <div className="space-y-2">
                                <Label htmlFor="register_department">Department</Label>
                                <select
                                    id="register_department"
                                    value={form.department_id}
                                    onChange={handleChange('department_id')}
                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[#1a2a6c] focus:ring-2 focus:ring-[#1a2a6c]/30"
                                    required
                                >
                                    <option value="">Select department</option>
                                    {filteredDepartments.map((department) => (
                                        <option key={department.id} value={department.id}>
                                            {department.label} - {department.full_name}
                                            {department.graduating_year ? ` (${department.graduating_year})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label>Department</Label>
                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                                    {registrationLink.fixed_department
                                        ? `${registrationLink.fixed_department.label} - ${registrationLink.fixed_department.full_name}`
                                        : 'Not set'}
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="register_motto">Motto (Optional)</Label>
                            <Textarea
                                id="register_motto"
                                rows={2}
                                value={form.motto}
                                onChange={handleChange('motto')}
                                placeholder="Your yearbook motto"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="register_badge">Badge (Optional)</Label>
                            <Input
                                id="register_badge"
                                value={form.badge}
                                onChange={handleChange('badge')}
                                placeholder="Example: Magna Cum Laude"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="register_photo">Photo URL (Optional)</Label>
                            <Input
                                id="register_photo"
                                value={form.photo}
                                onChange={handleChange('photo')}
                                placeholder="https://example.com/photo.jpg"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="register_photo_upload">Or Upload Photo (Optional)</Label>
                            <input
                                id="register_photo_upload"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
                            />
                        </div>

                        {submitError ? (
                            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                {submitError}
                            </p>
                        ) : null}

                        {successMessage ? (
                            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                                {successMessage}
                            </p>
                        ) : null}

                        <Button
                            type="submit"
                            disabled={submitting || isUnavailable}
                            className="h-11 w-full text-sm font-medium"
                            style={{ background: palette.navy, color: 'white' }}
                        >
                            {submitting ? 'Submitting...' : isUnavailable ? 'Registration Unavailable' : 'Register'}
                        </Button>
                    </form>
                </section>
            </div>
        </div>
    );
}
