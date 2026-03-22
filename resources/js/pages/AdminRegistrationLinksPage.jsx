import axios from 'axios';
import { CalendarClock, Copy, ExternalLink, Link2, Plus, Power, SquarePen } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import LinkStatusBadge from '@/components/registration/LinkStatusBadge';
import { Button } from '@/components/ui/button';
import { yearbookPalette as palette } from '@/lib/theme';

function formatDateTime(value) {
    if (!value) {
        return 'No limit';
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(parsed);
}

function scopeLabel(link) {
    const year = link.yearbook?.graduating_year ? `Year ${link.yearbook.graduating_year}` : 'Any year';
    const department = link.department?.label ? link.department.label : 'Any department';

    return `${year} · ${department}`;
}

export default function AdminRegistrationLinksPage() {
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [processingId, setProcessingId] = useState(null);
    const [copiedId, setCopiedId] = useState(null);
    const [actionMessage, setActionMessage] = useState('');

    const fetchLinks = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const response = await axios.get('/api/admin/registration-links');
            setLinks(response.data.registration_links ?? []);
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to load registration links.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLinks();
    }, [fetchLinks]);

    const handleToggle = async (linkId) => {
        setProcessingId(linkId);
        setActionMessage('');

        try {
            const response = await axios.patch(`/api/admin/registration-links/${linkId}/toggle`);
            const updatedLink = response.data.registration_link;

            setLinks((current) =>
                current.map((item) => (item.id === updatedLink.id ? updatedLink : item)),
            );
            setActionMessage('Registration link status updated.');
        } catch (requestError) {
            setActionMessage(requestError.response?.data?.message || 'Unable to update link status.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleCopyUrl = async (linkId, url) => {
        setActionMessage('');

        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(url);
            } else {
                const tempInput = document.createElement('input');
                tempInput.value = url;
                document.body.appendChild(tempInput);
                tempInput.select();
                document.execCommand('copy');
                document.body.removeChild(tempInput);
            }

            setCopiedId(linkId);
            setActionMessage('Registration link URL copied.');
            window.setTimeout(() => setCopiedId(null), 1500);
        } catch {
            setActionMessage('Unable to copy URL.');
        }
    };

    if (loading) {
        return <p className="text-sm text-slate-500">Loading registration links...</p>;
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
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p
                            className="text-xs uppercase tracking-[0.2em]"
                            style={{ fontFamily: "'Helvetica Neue', sans-serif", color: palette.red }}
                        >
                            Management
                        </p>
                        <h1 className="mt-3 text-3xl font-bold text-slate-900">Registration Links</h1>
                        <p className="mt-2 max-w-2xl text-sm text-slate-500">
                            Create time-bound registration links and control whether year or department is fixed during signup.
                        </p>
                    </div>

                    <Button asChild className="h-11 rounded-xl px-5" style={{ background: palette.navy }}>
                        <Link to="/admin/registration-links/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Link
                        </Link>
                    </Button>
                </div>
            </section>

            <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/5">
                <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:px-6">
                    <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Records</p>
                        <h2 className="mt-1 text-lg font-semibold text-slate-900">Generated Links</h2>
                    </div>
                    <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{ background: `${palette.navy}16`, color: palette.navy }}
                    >
                        <Link2 className="h-5 w-5" />
                    </div>
                </header>

                {actionMessage ? (
                    <div className="border-b border-slate-100 px-5 py-3 text-sm text-slate-600 sm:px-6">
                        {actionMessage}
                    </div>
                ) : null}

                {links.length === 0 ? (
                    <div className="px-5 py-10 text-center text-sm text-slate-500 sm:px-6">
                        No registration links found.
                    </div>
                ) : (
                    <>
                        <div className="divide-y divide-slate-200 md:hidden">
                            {links.map((link) => (
                                <article key={link.id} className="space-y-3 px-5 py-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-semibold text-slate-900">{link.title}</p>
                                            <p className="mt-1 text-xs text-slate-500">{link.type_label}</p>
                                        </div>
                                        <LinkStatusBadge status={link.status} />
                                    </div>

                                    <p className="text-xs text-slate-600">{scopeLabel(link)}</p>
                                    <p className="text-xs text-slate-500">
                                        {formatDateTime(link.starts_at)} to {formatDateTime(link.ends_at)}
                                    </p>
                                    <p className="text-xs text-slate-500">Registrations: {link.registrations_count}</p>

                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleCopyUrl(link.id, link.registration_url)}
                                            className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700"
                                        >
                                            <Copy className="h-3.5 w-3.5" />
                                            {copiedId === link.id ? 'Copied' : 'Copy URL'}
                                        </button>

                                        <Button asChild variant="outline" size="sm" className="rounded-lg">
                                            <Link to={`/admin/registration-links/${link.id}`}>
                                                <SquarePen className="mr-1 h-3.5 w-3.5" />
                                                Edit
                                            </Link>
                                        </Button>

                                        <button
                                            type="button"
                                            onClick={() => handleToggle(link.id)}
                                            disabled={processingId === link.id}
                                            className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 disabled:opacity-60"
                                        >
                                            <Power className="h-3.5 w-3.5" />
                                            {link.is_active ? 'Disable' : 'Enable'}
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>

                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full min-w-[1100px] border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        {['Title', 'Type', 'Scope', 'Schedule', 'Status', 'Registrations', 'Actions'].map((heading) => (
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
                                    {links.map((link) => (
                                        <tr key={link.id} className="border-b border-slate-100 align-top hover:bg-slate-50/70">
                                            <td className="px-5 py-3">
                                                <p className="font-medium text-slate-900">{link.title}</p>
                                                <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
                                                    <Link2 className="h-3.5 w-3.5" />
                                                    {link.token}
                                                </p>
                                            </td>
                                            <td className="px-5 py-3 text-slate-600">{link.type_label}</td>
                                            <td className="px-5 py-3 text-slate-600">{scopeLabel(link)}</td>
                                            <td className="px-5 py-3 text-slate-600">
                                                <p className="inline-flex items-center gap-1.5">
                                                    <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                                                    {formatDateTime(link.starts_at)}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    to {formatDateTime(link.ends_at)}
                                                </p>
                                            </td>
                                            <td className="px-5 py-3">
                                                <LinkStatusBadge status={link.status} />
                                            </td>
                                            <td className="px-5 py-3 text-slate-600">{link.registrations_count}</td>
                                            <td className="px-5 py-3">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopyUrl(link.id, link.registration_url)}
                                                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-xs font-medium text-slate-700"
                                                    >
                                                        <Copy className="h-3.5 w-3.5" />
                                                        {copiedId === link.id ? 'Copied' : 'Copy'}
                                                    </button>

                                                    <Button asChild variant="outline" size="sm" className="h-8 rounded-lg px-2.5 text-xs">
                                                        <Link to={`/admin/registration-links/${link.id}`}>
                                                            <SquarePen className="mr-1 h-3.5 w-3.5" />
                                                            Edit
                                                        </Link>
                                                    </Button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggle(link.id)}
                                                        disabled={processingId === link.id}
                                                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-xs font-medium text-slate-700 disabled:opacity-60"
                                                    >
                                                        <Power className="h-3.5 w-3.5" />
                                                        {link.is_active ? 'Disable' : 'Enable'}
                                                    </button>
                                                </div>

                                                <a
                                                    href={link.registration_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
                                                >
                                                    Open link
                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}
