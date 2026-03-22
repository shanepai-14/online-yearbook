import axios from 'axios';
import { ArrowLeft, Link2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import LinkStatusBadge from '@/components/registration/LinkStatusBadge';
import RegistrationLinkForm from '@/components/registration/RegistrationLinkForm';
import RegistrationAvailabilityNotice from '@/components/registration/RegistrationAvailabilityNotice';
import { Button } from '@/components/ui/button';
import { yearbookPalette as palette } from '@/lib/theme';

export default function AdminRegistrationLinkFormPage() {
    const navigate = useNavigate();
    const { id } = useParams();

    const isCreateMode = !id;
    const [initialValues, setInitialValues] = useState(null);
    const [options, setOptions] = useState({ types: [], yearbooks: [], departments: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitError, setSubmitError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const pageTitle = useMemo(
        () => (isCreateMode ? 'Create Registration Link' : 'Update Registration Link'),
        [isCreateMode],
    );

    const loadPageData = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            if (isCreateMode) {
                const response = await axios.get('/api/admin/registration-links');
                setOptions(response.data.options ?? { types: [], yearbooks: [], departments: [] });
                setInitialValues(null);
            } else {
                const response = await axios.get(`/api/admin/registration-links/${id}`);
                setInitialValues(response.data.registration_link ?? null);
                setOptions(response.data.options ?? { types: [], yearbooks: [], departments: [] });
            }
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to load registration link data.');
        } finally {
            setLoading(false);
        }
    }, [id, isCreateMode]);

    useEffect(() => {
        loadPageData();
    }, [loadPageData]);

    const handleSubmit = async (payload) => {
        setSubmitting(true);
        setSubmitError('');

        try {
            if (isCreateMode) {
                await axios.post('/api/admin/registration-links', payload);
            } else {
                await axios.put(`/api/admin/registration-links/${id}`, payload);
            }

            navigate('/admin/registration-links', { replace: true });
        } catch (requestError) {
            const details = requestError.response?.data?.errors;

            if (details && typeof details === 'object') {
                const firstField = Object.keys(details)[0];
                const firstError = details[firstField]?.[0];
                setSubmitError(firstError || 'Unable to save registration link.');
            } else {
                setSubmitError(requestError.response?.data?.message || 'Unable to save registration link.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <p className="text-sm text-slate-500">Loading registration link form...</p>;
    }

    if (error) {
        return (
            <div className="space-y-3">
                <p className="text-sm" style={{ color: palette.red }}>
                    {error}
                </p>
                <Button asChild variant="outline">
                    <Link to="/admin/registration-links">Back to registration links</Link>
                </Button>
            </div>
        );
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
                            Registration Links
                        </p>
                        <h1 className="mt-3 text-3xl font-bold text-slate-900">{pageTitle}</h1>
                        <p className="mt-2 max-w-2xl text-sm text-slate-500">
                            Configure link behavior by choosing what the student can select during registration.
                        </p>
                    </div>

                    <Button asChild variant="outline" className="h-11 rounded-xl px-4">
                        <Link to="/admin/registration-links">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Link>
                    </Button>
                </div>
            </section>

            {!isCreateMode && initialValues ? (
                <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Current Link Status</p>
                            <div className="mt-2 flex items-center gap-2">
                                <Link2 className="h-4 w-4 text-slate-500" />
                                <span className="text-sm text-slate-700">{initialValues.registration_url}</span>
                            </div>
                        </div>
                        <LinkStatusBadge status={initialValues.status} />
                    </div>

                    <div className="mt-4">
                        <RegistrationAvailabilityNotice
                            status={initialValues.status}
                            message={initialValues.availability_message}
                        />
                    </div>
                </section>
            ) : null}

            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
                <RegistrationLinkForm
                    initialValues={initialValues}
                    options={options}
                    onSubmit={handleSubmit}
                    submitting={submitting}
                    errorMessage={submitError}
                    submitLabel={isCreateMode ? 'Create Link' : 'Save Changes'}
                />
            </section>
        </div>
    );
}
