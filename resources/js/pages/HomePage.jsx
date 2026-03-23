import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { yearbookPalette as palette } from '@/lib/theme';

const sansStyle = { fontFamily: "'Helvetica Neue', sans-serif" };

const DVCLogo = () => (
    <svg viewBox="0 0 100 100" className="h-full w-full">
        <circle cx="50" cy="50" r="50" fill={palette.navy} />
        <circle cx="50" cy="50" r="44" fill="none" stroke={palette.gold} strokeWidth="3" />
        <ellipse cx="50" cy="50" rx="30" ry="44" fill={palette.red} />
        <ellipse cx="50" cy="50" rx="44" ry="30" fill={palette.red} />
        <polygon points="50,10 58,46 94,50 58,54 50,90 42,54 6,50 42,46" fill={palette.gold} />
    </svg>
);

function DeptPreview({ dept }) {
    const [isHidden, setIsHidden] = useState(false);

    if (isHidden) {
        return null;
    }

    return (
        <div className="group relative min-w-0 flex-1 overflow-hidden" style={{ background: '#eef1f8' }}>
            <img
                src={dept.photo}
                alt={dept.label}
                className="h-full w-full object-cover transition-all duration-500 group-hover:scale-105"
                style={{ filter: 'grayscale(25%) brightness(0.75)' }}
                onError={() => setIsHidden(true)}
            />
            <div
                className="absolute inset-0 flex flex-col justify-end p-3"
                style={{ background: 'linear-gradient(transparent 40%, rgba(10,15,40,0.85))' }}
            >
                <div
                    className="text-xs font-medium uppercase tracking-widest"
                    style={{ ...sansStyle, color: palette.gold }}
                >
                    {dept.label}
                </div>
                <div className="mt-0.5 text-xs" style={{ ...sansStyle, color: 'rgba(255,255,255,0.55)' }}>
                    {dept.count} grads
                </div>
            </div>
        </div>
    );
}

function YearCard({ data, isLatest, onClick }) {
    const [hovered, setHovered] = useState(false);
    const departments = Array.isArray(data?.departments) ? data.departments : [];
    const departmentsWithPhotos = departments.filter(
        (department) => typeof department?.photo === 'string' && department.photo.trim() !== '',
    );

    return (
        <button
            type="button"
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="cursor-pointer overflow-hidden text-left transition-all duration-300"
            style={{
                background: '#fff',
                border: isLatest ? `2px solid ${palette.goldDark}` : `1px solid ${palette.cardBorder}`,
                boxShadow: hovered ? '0 8px 32px rgba(26,42,108,0.13)' : '0 2px 8px rgba(26,42,108,0.05)',
                transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
            }}
        >
            <div
                className="flex items-center justify-between px-5 py-4"
                style={{ background: palette.navy, borderBottom: `2px solid ${palette.goldDark}` }}
            >
                <div>
                    {isLatest ? (
                        <div
                            className="mb-1 text-xs uppercase tracking-[0.2em]"
                            style={{ ...sansStyle, color: palette.gold, fontSize: '9px' }}
                        >
                            Latest Batch
                        </div>
                    ) : null}
                    <div className="text-3xl font-normal tracking-wide" style={{ color: palette.gold, fontFamily: 'Georgia, serif' }}>
                        {data.year}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-normal" style={{ color: palette.gold }}>
                        {data.total_graduates}
                    </div>
                    <div
                        className="mt-0.5 text-xs uppercase tracking-[0.15em]"
                        style={{ ...sansStyle, color: 'rgba(232,217,138,0.65)', fontSize: '10px' }}
                    >
                        graduates
                    </div>
                </div>
            </div>

            {departmentsWithPhotos.length > 0 ? (
                <div className="flex" style={{ height: '160px' }}>
                    {departmentsWithPhotos.map((dept) => (
                        <DeptPreview key={dept.id} dept={dept} />
                    ))}
                </div>
            ) : null}

            <div className="border-t px-5 py-4" style={{ borderColor: '#f0f1f5' }}>
                <div
                    className="mb-1.5 text-xs uppercase tracking-[0.15em]"
                    style={{ ...sansStyle, color: palette.red, fontSize: '9px' }}
                >
                    Class Motto
                </div>
                <div className="text-sm italic leading-relaxed" style={{ fontFamily: 'Georgia, serif', color: '#3a4060' }}>
                    "{data.motto || 'A milestone year of growth, resilience, and shared achievement.'}"
                </div>
            </div>

            <div className="flex items-center justify-between px-5 pb-4">
                <div className="flex gap-1.5">
                    {departments.map((department) => (
                        <span
                            key={department.id}
                            className="px-2 py-0.5 text-xs tracking-wide"
                            style={{
                                ...sansStyle,
                                fontSize: '10px',
                                background: palette.lightBg,
                                color: palette.navy,
                                border: `1px solid ${palette.cardBorder}`,
                            }}
                        >
                            {department.label}
                        </span>
                    ))}
                </div>
                <div
                    className="flex items-center gap-1.5 text-xs uppercase tracking-[0.15em] transition-colors duration-200"
                    style={{ ...sansStyle, color: hovered ? palette.red : '#9ca3af', fontSize: '10px' }}
                >
                    View Yearbook
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path
                            d="M2 6h8M7 3l3 3-3 3"
                            stroke="currentColor"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
            </div>
        </button>
    );
}

export default function HomePage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [schoolName, setSchoolName] = useState('Davao Vision Colleges');
    const [years, setYears] = useState([]);

    useEffect(() => {
        let mounted = true;

        const loadArchive = async () => {
            try {
                const response = await axios.get('/api/yearbooks');

                if (!mounted) {
                    return;
                }

                const payloadYears = Array.isArray(response.data?.years) ? response.data.years : [];

                setSchoolName(response.data?.school_name || 'School');
                setYears(payloadYears);
            } catch (requestError) {
                if (!mounted) {
                    return;
                }

                setError(requestError.response?.data?.message || 'Unable to load yearbook archive.');
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        loadArchive();

        return () => {
            mounted = false;
        };
    }, []);

    const sortedYears = useMemo(() => {
        return [...years].sort((a, b) => Number(b.year) - Number(a.year));
    }, [years]);

    return (
        <div className="min-h-screen font-serif" style={{ background: palette.lightBg }}>
            <nav
                className="flex h-14 items-center justify-between border-b-2 px-6 sm:px-10"
                style={{ background: palette.navy, borderColor: palette.goldDark }}
            >
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-white">
                        <DVCLogo />
                    </div>
                    <span
                        className="text-xs uppercase tracking-[0.2em]"
                        style={{ ...sansStyle, color: palette.gold }}
                    >
                        {schoolName} · Yearbook
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => navigate('/yearbook/fun-card')}
                        className="border px-3 py-1 text-xs uppercase tracking-[0.15em] transition-colors"
                        style={{
                            ...sansStyle,
                            borderColor: 'rgba(232,217,138,0.35)',
                            color: 'rgba(232,217,138,0.92)',
                            background: 'rgba(255,255,255,0.05)',
                        }}
                    >
                        Fun Card
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/yearbook/login')}
                        className="border px-3 py-1 text-xs uppercase tracking-[0.15em] transition-colors"
                        style={{
                            ...sansStyle,
                            borderColor: 'rgba(232,217,138,0.35)',
                            color: 'rgba(232,217,138,0.92)',
                            background: 'rgba(255,255,255,0.05)',
                        }}
                    >
                        Login
                    </button>
                </div>
            </nav>

            <section
                className="relative overflow-hidden border-b-2 px-6 pb-12 pt-14 sm:px-10"
                style={{ background: palette.navy, borderColor: palette.goldDark }}
            >
                <div
                    className="pointer-events-none absolute right-0 top-0 h-full w-80"
                    style={{ background: 'rgba(184,56,40,0.07)', clipPath: 'polygon(15% 0,100% 0,100% 100%,0% 100%)' }}
                />
                <div
                    className="mb-3 text-xs uppercase tracking-[0.2em]"
                    style={{ ...sansStyle, color: palette.goldDark }}
                >
                    Online Yearbook Archive
                </div>
                <h1 className="mb-2 text-5xl font-normal tracking-wide text-white" style={{ letterSpacing: '2px' }}>
                    Our <span style={{ color: palette.gold }}>Graduates</span>
                </h1>
                <div className="my-4 h-0.5 w-12" style={{ background: palette.red }} />
                <p className="max-w-lg text-sm leading-relaxed" style={{ ...sansStyle, color: 'rgba(255,255,255,0.55)' }}>
                    Browse through each graduating batch. Every yearbook preserves the faces, stories, and milestones of the class.
                </p>
            </section>

            <section className="px-6 pb-2 pt-10 sm:px-10">
                <div className="mb-1 flex items-center gap-3">
                    <span
                        className="text-xs uppercase tracking-[0.2em]"
                        style={{ ...sansStyle, color: palette.muted, fontSize: '10px' }}
                    >
                        Graduating Classes
                    </span>
                    <div className="h-px flex-1" style={{ background: palette.cardBorder }} />
                </div>
                <p className="text-xs" style={{ ...sansStyle, color: '#9ca3af' }}>
                    Click any card to open the full yearbook for that batch.
                </p>
            </section>

            <section className="px-6 py-6 sm:px-10">
                {loading ? (
                    <div
                        className="rounded-xl border bg-white px-5 py-8 text-sm"
                        style={{ ...sansStyle, borderColor: palette.cardBorder, color: palette.muted }}
                    >
                        Loading yearbook archive...
                    </div>
                ) : null}

                {!loading && error ? (
                    <div
                        className="rounded-xl border bg-white px-5 py-8 text-sm"
                        style={{ ...sansStyle, borderColor: 'rgba(184,56,40,0.3)', color: palette.red }}
                    >
                        {error}
                    </div>
                ) : null}

                {!loading && !error && sortedYears.length === 0 ? (
                    <div
                        className="rounded-xl border bg-white px-5 py-8 text-sm"
                        style={{ ...sansStyle, borderColor: palette.cardBorder, color: palette.muted }}
                    >
                        No yearbooks found yet.
                    </div>
                ) : null}

                {!loading && !error && sortedYears.length > 0 ? (
                    <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))' }}>
                        {sortedYears.map((yearItem, index) => (
                            <YearCard
                                key={yearItem.year}
                                data={yearItem}
                                isLatest={index === 0}
                                onClick={() => navigate(`/yearbook/${yearItem.year}`)}
                            />
                        ))}
                    </div>
                ) : null}
            </section>

            <footer
                className="mt-11 flex items-center justify-between border-t-2 px-6 py-7 sm:px-10"
                style={{ background: palette.navy, borderColor: palette.goldDark }}
            >
                <div
                    className="text-xs uppercase tracking-[0.2em]"
                    style={{ ...sansStyle, color: palette.gold }}
                >
                    {schoolName}
                </div>
                <div className="text-xs" style={{ ...sansStyle, color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>
                    YEARBOOK ARCHIVE · ALL RIGHTS RESERVED
                </div>
            </footer>
        </div>
    );
}
