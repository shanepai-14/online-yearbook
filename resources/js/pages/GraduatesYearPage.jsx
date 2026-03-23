import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { Heart, Menu, X } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import BookView from '@/components/yearbook/BookView';
import CardModal from '@/components/yearbook/CardModal';
import { yearbookPalette as palette } from '@/lib/theme';

const FACULTY_PLACEHOLDER = 'https://via.placeholder.com/120';
const STUDENT_PLACEHOLDER = 'https://via.placeholder.com/160';
const GROUP_PHOTO_PLACEHOLDER = 'https://via.placeholder.com/1200x720?text=Department+Group+Photo';

function reactionKey(type, id) {
    return `${type}:${id}`;
}

function photoOrPlaceholder(photo, placeholder) {
    if (typeof photo !== 'string') {
        return placeholder;
    }

    const trimmed = photo.trim();

    return trimmed !== '' ? trimmed : placeholder;
}

const DVCLogo = () => (
    <svg viewBox="0 0 100 100" className="h-full w-full">
        <circle cx="50" cy="50" r="50" fill={palette.navy} />
        <circle cx="50" cy="50" r="44" fill="none" stroke={palette.gold} strokeWidth="3" />
        <ellipse cx="50" cy="50" rx="30" ry="44" fill={palette.red} />
        <ellipse cx="50" cy="50" rx="44" ry="30" fill={palette.red} />
        <polygon points="50,10 58,46 94,50 58,54 50,90 42,54 6,50 42,46" fill={palette.gold} />
    </svg>
);

function SectionDivider({ label, alignment = 'left' }) {
    if (alignment === 'center') {
        return (
            <div className="mb-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200" />
                <span
                    className="whitespace-nowrap text-xs uppercase tracking-[0.2em]"
                    style={{
                        fontFamily: "'Helvetica Neue', sans-serif",
                        color: palette.muted,
                    }}
                >
                    {label}
                </span>
                <div className="h-px flex-1 bg-gray-200" />
            </div>
        );
    }

    if (alignment === 'right') {
        return (
            <div className="mb-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200" />
                <span
                    className="whitespace-nowrap text-xs uppercase tracking-[0.2em]"
                    style={{
                        fontFamily: "'Helvetica Neue', sans-serif",
                        color: palette.muted,
                    }}
                >
                    {label}
                </span>
            </div>
        );
    }

    return (
        <div className="mb-4 flex items-center gap-3">
            <span
                className="whitespace-nowrap text-xs uppercase tracking-[0.2em]"
                style={{
                    fontFamily: "'Helvetica Neue', sans-serif",
                    color: palette.muted,
                }}
            >
                {label}
            </span>
            <div className="h-px flex-1 bg-gray-200" />
        </div>
    );
}

function FacultyCard({ faculty, alignment = 'left', reaction, onClick }) {
    const textAlignClass =
        alignment === 'center' ? 'text-center' : alignment === 'right' ? 'text-right' : 'text-left';
    const heartCount = Number(reaction?.total ?? faculty.reaction_count ?? 0);
    const isReacted = Boolean(reaction?.reacted ?? faculty.reacted_by_viewer);

    return (
        <button
            type="button"
            onClick={onClick}
            className="group w-full cursor-pointer overflow-hidden border bg-white text-left transition-all duration-200 hover:shadow-md"
            style={{ borderColor: palette.cardBorder }}
        >
            <div className="relative w-full overflow-hidden bg-gray-100" style={{ aspectRatio: '1 / 1' }}>
                <img
                    src={photoOrPlaceholder(faculty.photo, FACULTY_PLACEHOLDER)}
                    alt={faculty.name}
                    className="h-full w-full object-cover grayscale-[20%] transition-all duration-300 group-hover:grayscale-0"
                    onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = FACULTY_PLACEHOLDER;
                    }}
                />
                <div className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] text-white">
                    <Heart className={`h-3 w-3 ${isReacted ? 'fill-current text-rose-400' : ''}`} />
                    <span>{heartCount}</span>
                </div>
            </div>
            <div className={`border-t-2 px-3 py-3 ${textAlignClass}`} style={{ borderColor: palette.navy }}>
                <div className="mb-1 text-sm" style={{ color: palette.navy, letterSpacing: '0.3px' }}>
                    {faculty.name}
                </div>
                <div
                    className="text-xs"
                    style={{
                        fontFamily: "'Helvetica Neue', sans-serif",
                        color: palette.red,
                        letterSpacing: '0.5px',
                    }}
                >
                    {faculty.role}
                </div>
            </div>
        </button>
    );
}

function StudentCard({ student, alignment = 'left', reaction, onClick }) {
    const textAlignClass =
        alignment === 'center' ? 'text-center' : alignment === 'right' ? 'text-right' : 'text-left';
    const heartCount = Number(reaction?.total ?? student.reaction_count ?? 0);
    const isReacted = Boolean(reaction?.reacted ?? student.reacted_by_viewer);

    return (
        <button
            type="button"
            onClick={onClick}
            className="group w-full cursor-pointer overflow-hidden border bg-white text-left transition-all duration-200 hover:shadow-md"
            style={{ borderColor: palette.cardBorder }}
        >
            <div className="relative w-full overflow-hidden" style={{ aspectRatio: '3 / 4', background: '#e8eaf2' }}>
                <img
                    src={photoOrPlaceholder(student.photo, STUDENT_PLACEHOLDER)}
                    alt={student.name}
                    className="h-full w-full object-cover grayscale-[10%] transition-all duration-300 group-hover:grayscale-0"
                    onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = STUDENT_PLACEHOLDER;
                    }}
                />
                <div className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] text-white">
                    <Heart className={`h-3 w-3 ${isReacted ? 'fill-current text-rose-400' : ''}`} />
                    <span>{heartCount}</span>
                </div>
                <div
                    className={`absolute bottom-0 left-0 right-0 px-3 pb-3 pt-10 ${textAlignClass}`}
                    style={{ background: `linear-gradient(transparent, ${palette.navy}eb)` }}
                >
                    <div className="mb-1 text-sm text-white" style={{ letterSpacing: '0.4px' }}>
                        {student.name}
                    </div>
                    {student.motto ? (
                        <div
                            className="mb-2 px-1 text-xs italic leading-snug"
                            style={{
                                fontFamily: 'Georgia, serif',
                                color: 'rgba(232,217,138,0.85)',
                            }}
                        >
                            "{student.motto}"
                        </div>
                    ) : null}
                    {student.badge ? (
                        <span
                            className="inline-block border px-2 py-1 text-xs uppercase"
                            style={{
                                fontSize: '9px',
                                letterSpacing: '1px',
                                fontFamily: "'Helvetica Neue', sans-serif",
                                color: 'rgba(232,217,138,0.9)',
                                borderColor: 'rgba(232,217,138,0.9)',
                            }}
                        >
                            {student.badge}
                        </span>
                    ) : null}
                </div>
            </div>
        </button>
    );
}

function DepartmentGroupPhotoSlider({ photos = [], alignment = 'left', label }) {
    const safePhotos = Array.isArray(photos)
        ? photos.filter((photo) => typeof photo === 'string' && photo.trim() !== '')
        : [];
    const photosKey = safePhotos.join('|');
    const [activeIndex, setActiveIndex] = useState(0);
    const [touchStartX, setTouchStartX] = useState(null);

    const goNext = () => {
        setActiveIndex((current) => (current + 1) % safePhotos.length);
    };

    const goPrev = () => {
        setActiveIndex((current) => (current - 1 + safePhotos.length) % safePhotos.length);
    };

    useEffect(() => {
        setActiveIndex(0);
    }, [photosKey]);

    useEffect(() => {
        if (safePhotos.length <= 1) {
            return;
        }

        const intervalId = window.setInterval(() => {
            goNext();
        }, 4500);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [safePhotos.length]);

    if (safePhotos.length === 0) {
        return null;
    }

    const alignClass =
        alignment === 'center' ? 'mx-auto max-w-4xl' : alignment === 'right' ? 'ml-auto max-w-4xl' : '';

    return (
        <div className="mb-10">
            <SectionDivider label={label} alignment={alignment} />
            <div
                className={`relative overflow-hidden border bg-white ${alignClass}`}
                style={{ borderColor: palette.cardBorder }}
                onTouchStart={(event) => setTouchStartX(event.changedTouches[0]?.clientX ?? null)}
                onTouchEnd={(event) => {
                    if (touchStartX === null || safePhotos.length <= 1) {
                        return;
                    }

                    const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX;
                    const delta = touchEndX - touchStartX;

                    if (Math.abs(delta) >= 50) {
                        if (delta < 0) {
                            goNext();
                        } else {
                            goPrev();
                        }
                    }

                    setTouchStartX(null);
                }}
            >
                <div
                    className="flex transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(-${activeIndex * 100}%)` }}
                >
                    {safePhotos.map((photo, index) => (
                        <div key={`${photo}-${index}`} className="w-full shrink-0">
                            <img
                                src={photo}
                                alt={`Department group ${index + 1}`}
                                className="h-56 w-full object-cover sm:h-72 md:h-80"
                                onError={(event) => {
                                    event.currentTarget.onerror = null;
                                    event.currentTarget.src = GROUP_PHOTO_PLACEHOLDER;
                                }}
                            />
                        </div>
                    ))}
                </div>

                {safePhotos.length > 1 ? (
                    <>
                        <button
                            type="button"
                            onClick={goPrev}
                            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/55 px-2 py-1 text-sm text-white transition hover:bg-black/70"
                            aria-label="Previous group photo"
                        >
                            ‹
                        </button>
                        <button
                            type="button"
                            onClick={goNext}
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/55 px-2 py-1 text-sm text-white transition hover:bg-black/70"
                            aria-label="Next group photo"
                        >
                            ›
                        </button>
                        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/45 px-2 py-1">
                            {safePhotos.map((photo, index) => (
                                <button
                                    key={`${photo}-dot-${index}`}
                                    type="button"
                                    onClick={() => setActiveIndex(index)}
                                    className="h-1.5 w-1.5 rounded-full transition"
                                    style={{
                                        background: index === activeIndex ? palette.gold : 'rgba(255,255,255,0.5)',
                                    }}
                                    aria-label={`Go to group photo ${index + 1}`}
                                />
                            ))}
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
}

export default function GraduatesYearPage() {
    const { year } = useParams();
    const [yearbook, setYearbook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const enrichedDepartments = useMemo(() => {
        if (!yearbook) {
            return [];
        }

        return yearbook.departments.map((department) => ({
            ...department,
            tabId: String(department.id),
            faculty: yearbook.faculty.filter((member) => member.department_id === department.id),
            students: yearbook.students.filter((student) => student.department_id === department.id),
        }));
    }, [yearbook]);

    const [activeDept, setActiveDept] = useState('');
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState('default');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [reactionsByKey, setReactionsByKey] = useState({});
    const [reactionLoadingByKey, setReactionLoadingByKey] = useState({});
    const [modalState, setModalState] = useState({
        open: false,
        type: 'student',
        items: [],
        activeIndex: 0,
    });

    useEffect(() => {
        let mounted = true;

        const fetchYearbook = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await axios.get(`/api/yearbooks/${year}`);

                if (mounted) {
                    setYearbook(response.data ?? null);
                }
            } catch (requestError) {
                if (!mounted) {
                    return;
                }

                if (requestError.response?.status === 404) {
                    setError('not_found');
                } else {
                    setError('request_failed');
                }

                setYearbook(null);
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        fetchYearbook();

        return () => {
            mounted = false;
        };
    }, [year]);

    useEffect(() => {
        setActiveDept(enrichedDepartments[0]?.tabId ?? '');
        setSearch('');
    }, [enrichedDepartments]);

    useEffect(() => {
        setModalState((currentState) => ({
            ...currentState,
            open: false,
        }));
    }, [year, activeDept, search, viewMode]);

    useEffect(() => {
        setMobileMenuOpen(false);
    }, [year, viewMode, activeDept]);

    useEffect(() => {
        if (!yearbook) {
            setReactionsByKey({});
            return;
        }

        const seededReactions = {};

        yearbook.students.forEach((student) => {
            seededReactions[reactionKey('student', student.id)] = {
                total: Number(student.reaction_count ?? 0),
                reacted: Boolean(student.reacted_by_viewer),
            };
        });

        yearbook.faculty.forEach((faculty) => {
            seededReactions[reactionKey('faculty', faculty.id)] = {
                total: Number(faculty.reaction_count ?? 0),
                reacted: Boolean(faculty.reacted_by_viewer),
            };
        });

        setReactionsByKey(seededReactions);
    }, [yearbook]);

    if (loading) {
        return (
            <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 text-center">
                <p className="text-sm" style={{ color: palette.muted }}>
                    Loading yearbook...
                </p>
            </div>
        );
    }

    if (error === 'request_failed') {
        return (
            <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 text-center">
                <h1 className="text-2xl font-semibold" style={{ color: palette.navyDark }}>
                    Unable to load yearbook
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                    Please try again in a moment.
                </p>
                <Button asChild className="mt-6" style={{ background: palette.navy }}>
                    <Link to="/yearbook">Back to Home</Link>
                </Button>
            </div>
        );
    }

    if (error === 'not_found' || !yearbook) {
        return (
            <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 text-center">
                <h1 className="text-2xl font-semibold" style={{ color: palette.navyDark }}>
                    Yearbook not found
                </h1>
                <p className="mt-2 text-sm text-slate-600">No public yearbook is available for {year}.</p>
                <Button asChild className="mt-6" style={{ background: palette.navy }}>
                    <Link to="/yearbook">Back to Home</Link>
                </Button>
            </div>
        );
    }

    const schoolName = yearbook.school_name || 'School';

    const activeDepartment = enrichedDepartments.find((department) => department.tabId === activeDept) ?? null;
    const activeDepartmentGroupPhotos = activeDepartment
        ? Array.isArray(activeDepartment.group_photos)
            ? activeDepartment.group_photos
            : activeDepartment.group_photo
                ? [activeDepartment.group_photo]
                : []
        : [];

    const searchResults = search.trim()
        ? enrichedDepartments.flatMap((department) =>
              department.students
                  .filter((student) =>
                      `${student.name} ${department.label}`.toLowerCase().includes(search.toLowerCase()),
                  )
                  .map((student) => ({ ...student, departmentLabel: department.label })),
          )
        : null;

    const stats = [
        [String(yearbook.stats.graduates_count), 'Graduates'],
        [String(yearbook.stats.programs_count), 'Programs'],
        [String(yearbook.stats.faculty_count), 'Faculty'],
        [String(yearbook.stats.years_count), 'Years'],
    ];

    const contentAlignment = ['left', 'center', 'right'].includes(yearbook.content_alignment)
        ? yearbook.content_alignment
        : 'left';

    const textAlignClass =
        contentAlignment === 'center'
            ? 'text-center'
            : contentAlignment === 'right'
              ? 'text-right'
              : 'text-left';

    const justifyClass =
        contentAlignment === 'center'
            ? 'justify-center'
            : contentAlignment === 'right'
              ? 'justify-end'
              : 'justify-start';

    const heroDescriptionPositionClass =
        contentAlignment === 'center' ? 'mx-auto' : contentAlignment === 'right' ? 'ml-auto' : '';

    const heroDividerPositionClass =
        contentAlignment === 'center' ? 'mx-auto' : contentAlignment === 'right' ? 'ml-auto' : '';

    const facultyGridTemplateColumns =
        contentAlignment === 'center'
            ? 'repeat(auto-fit,minmax(150px,150px))'
            : contentAlignment === 'right'
              ? 'repeat(auto-fit,minmax(150px,150px))'
              : 'repeat(auto-fill,minmax(150px,1fr))';

    const facultyGridJustifyClass =
        contentAlignment === 'center' ? 'justify-center' : contentAlignment === 'right' ? 'justify-end' : '';

    const studentGridTemplateColumns =
        contentAlignment === 'center'
            ? 'repeat(auto-fit,minmax(170px,170px))'
            : contentAlignment === 'right'
              ? 'repeat(auto-fit,minmax(170px,170px))'
              : 'repeat(auto-fill,minmax(170px,1fr))';

    const studentGridJustifyClass =
        contentAlignment === 'center' ? 'justify-center' : contentAlignment === 'right' ? 'justify-end' : '';

    const getReactionState = (targetType, item) => {
        const key = reactionKey(targetType, item.id);

        return (
            reactionsByKey[key] ?? {
                total: Number(item.reaction_count ?? 0),
                reacted: Boolean(item.reacted_by_viewer),
            }
        );
    };

    const openCardModal = (targetType, items, itemId) => {
        const activeIndex = items.findIndex((entry) => entry.id === itemId);

        if (activeIndex < 0) {
            return;
        }

        setModalState({
            open: true,
            type: targetType,
            items,
            activeIndex,
        });
    };

    const handleModalIndexChange = (nextIndex) => {
        setModalState((currentState) => ({
            ...currentState,
            activeIndex: Math.min(Math.max(nextIndex, 0), Math.max(currentState.items.length - 1, 0)),
        }));
    };

    const handleToggleReaction = async (targetType, targetId) => {
        const key = reactionKey(targetType, targetId);

        if (reactionLoadingByKey[key]) {
            return;
        }

        const currentReaction = reactionsByKey[key] ?? { total: 0, reacted: false };
        const optimisticReaction = {
            total: currentReaction.reacted ? Math.max(currentReaction.total - 1, 0) : currentReaction.total + 1,
            reacted: !currentReaction.reacted,
        };

        setReactionsByKey((currentState) => ({
            ...currentState,
            [key]: optimisticReaction,
        }));
        setReactionLoadingByKey((currentState) => ({
            ...currentState,
            [key]: true,
        }));

        try {
            const response = await axios.post('/api/reactions/toggle', {
                type: targetType,
                target_id: targetId,
            });

            setReactionsByKey((currentState) => ({
                ...currentState,
                [key]: {
                    total: Number(response.data.total ?? optimisticReaction.total),
                    reacted: Boolean(response.data.reacted),
                },
            }));
        } catch (requestError) {
            setReactionsByKey((currentState) => ({
                ...currentState,
                [key]: currentReaction,
            }));
        } finally {
            setReactionLoadingByKey((currentState) => ({
                ...currentState,
                [key]: false,
            }));
        }
    };

    return (
        <div className="min-h-screen" style={{ background: palette.lightBg, color: palette.navyDark }}>
            <nav
                className="border-b-2"
                style={{ background: palette.navy, borderColor: palette.goldDark }}
            >
                <div className="flex h-14 w-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
                    <Link to="/yearbook" className="flex min-w-0 items-center gap-3">
                        <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-white">
                            <DVCLogo />
                        </div>
                        <span
                            className="hidden truncate text-xs uppercase tracking-[0.2em] sm:inline"
                            style={{ fontFamily: "'Helvetica Neue', sans-serif", color: palette.gold }}
                        >
                            {schoolName} · Yearbook {yearbook.graduating_year}
                        </span>
                    </Link>

                    <div
                        className="hidden items-center rounded-full border p-0.5 sm:flex"
                        style={{
                            borderColor: `${palette.goldDark}88`,
                            background: 'rgba(255,255,255,0.06)',
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => setViewMode('default')}
                            className="rounded-full px-3 py-1 text-xs transition"
                            style={{
                                fontFamily: "'Helvetica Neue', sans-serif",
                                background: viewMode === 'default' ? palette.gold : 'transparent',
                                color: viewMode === 'default' ? palette.navy : '#e8e4d4',
                            }}
                        >
                            ⊞ Default
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('book')}
                            className="rounded-full px-3 py-1 text-xs transition"
                            style={{
                                fontFamily: "'Helvetica Neue', sans-serif",
                                background: viewMode === 'book' ? palette.gold : 'transparent',
                                color: viewMode === 'book' ? palette.navy : '#e8e4d4',
                            }}
                        >
                            📖 Book
                        </button>
                    </div>

                    <div className="hidden items-center gap-2 sm:flex">
                        {viewMode === 'default' ? (
                            <input
                                type="text"
                                placeholder="Search students..."
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                className="w-44 rounded px-3 py-1.5 text-xs focus:outline-none sm:w-52"
                                style={{
                                    fontFamily: "'Helvetica Neue', sans-serif",
                                    background: 'rgba(255,255,255,0.06)',
                                    border: `0.5px solid ${palette.goldDark}66`,
                                    color: '#e8e4d4',
                                }}
                            />
                        ) : (
                            <div
                                className="text-[11px] uppercase tracking-[0.16em]"
                                style={{ fontFamily: "'Helvetica Neue', sans-serif", color: '#e8e4d4a8' }}
                            >
                                Book Mode
                            </div>
                        )}

                        <Link
                            to="/yearbook/login"
                            className="rounded border px-3 py-1.5 text-xs uppercase tracking-[0.15em] transition"
                            style={{
                                fontFamily: "'Helvetica Neue', sans-serif",
                                borderColor: `${palette.goldDark}66`,
                                color: '#e8e4d4',
                                background: 'rgba(255,255,255,0.06)',
                            }}
                        >
                            Login
                        </Link>
                    </div>

                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen((current) => !current)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded border sm:hidden"
                        style={{
                            borderColor: `${palette.goldDark}66`,
                            color: '#e8e4d4',
                            background: 'rgba(255,255,255,0.06)',
                        }}
                        aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                    >
                        {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                    </button>
                </div>
            </nav>

            {mobileMenuOpen ? (
                <div
                    className="border-b-2 px-4 py-3 sm:hidden"
                    style={{ background: palette.navy, borderColor: palette.goldDark }}
                >
                    <div className="space-y-3">
                        <div
                            className="flex items-center rounded-full border p-0.5"
                            style={{
                                borderColor: `${palette.goldDark}88`,
                                background: 'rgba(255,255,255,0.06)',
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => setViewMode('default')}
                                className="flex-1 rounded-full px-3 py-1.5 text-xs transition"
                                style={{
                                    fontFamily: "'Helvetica Neue', sans-serif",
                                    background: viewMode === 'default' ? palette.gold : 'transparent',
                                    color: viewMode === 'default' ? palette.navy : '#e8e4d4',
                                }}
                            >
                                ⊞ Default
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('book')}
                                className="flex-1 rounded-full px-3 py-1.5 text-xs transition"
                                style={{
                                    fontFamily: "'Helvetica Neue', sans-serif",
                                    background: viewMode === 'book' ? palette.gold : 'transparent',
                                    color: viewMode === 'book' ? palette.navy : '#e8e4d4',
                                }}
                            >
                                📖 Book
                            </button>
                        </div>

                        {viewMode === 'default' ? (
                            <input
                                type="text"
                                placeholder="Search students..."
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                className="h-10 w-full rounded px-3 text-xs focus:outline-none"
                                style={{
                                    fontFamily: "'Helvetica Neue', sans-serif",
                                    background: 'rgba(255,255,255,0.06)',
                                    border: `0.5px solid ${palette.goldDark}66`,
                                    color: '#e8e4d4',
                                }}
                            />
                        ) : (
                            <div
                                className="text-[11px] uppercase tracking-[0.16em]"
                                style={{ fontFamily: "'Helvetica Neue', sans-serif", color: '#e8e4d4a8' }}
                            >
                                Book Mode
                            </div>
                        )}

                        <Link
                            to="/yearbook/login"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex h-10 items-center justify-center rounded border text-xs uppercase tracking-[0.15em] transition"
                            style={{
                                fontFamily: "'Helvetica Neue', sans-serif",
                                borderColor: `${palette.goldDark}66`,
                                color: '#e8e4d4',
                                background: 'rgba(255,255,255,0.06)',
                            }}
                        >
                            Login
                        </Link>
                    </div>
                </div>
            ) : null}

            {viewMode === 'default' ? (
                <>
                    <section
                        className="relative overflow-hidden border-b-2"
                        style={{ background: palette.navy, borderColor: palette.goldDark }}
                    >
                        <div className="px-4 pb-10 pt-12 sm:px-6 lg:px-10">
                            <div
                                className="absolute right-0 top-0 h-full w-72"
                                style={{
                                    background: 'rgba(184,56,40,0.07)',
                                    clipPath: 'polygon(15% 0,100% 0,100% 100%,0% 100%)',
                                }}
                            />

                            <div
                                className={`mb-3 text-xs uppercase tracking-[0.2em] ${textAlignClass}`}
                                style={{ fontFamily: "'Helvetica Neue', sans-serif", color: palette.goldDark }}
                            >
                                {yearbook.academic_year_text}
                            </div>

                            <h1 className={`mb-2 text-4xl font-normal tracking-wide text-white ${textAlignClass}`}>
                                Class of <span style={{ color: palette.gold }}>{yearbook.graduating_year}</span>
                            </h1>

                            <div className={`my-4 h-0.5 w-12 ${heroDividerPositionClass}`} style={{ background: palette.red }} />

                            <p
                                className={`mb-8 max-w-lg text-sm leading-relaxed ${textAlignClass} ${heroDescriptionPositionClass}`}
                                style={{ fontFamily: "'Helvetica Neue', sans-serif", color: 'rgba(255,255,255,0.55)' }}
                            >
                                {yearbook.hero_description}
                            </p>

                            <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:hidden">
                                {stats.map((stat) => (
                                    <div key={stat[1]} className={textAlignClass}>
                                        <div className="text-2xl" style={{ color: palette.gold }}>
                                            {stat[0]}
                                        </div>
                                        <div
                                            className="mt-1 text-xs uppercase tracking-[0.15em]"
                                            style={{
                                                fontFamily: "'Helvetica Neue', sans-serif",
                                                color: 'rgba(255,255,255,0.4)',
                                            }}
                                        >
                                            {stat[1]}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className={`hidden w-full gap-0 overflow-x-auto sm:flex ${justifyClass}`}>
                                {stats.map((stat, index) => (
                                    <div
                                        key={stat[1]}
                                        className={`shrink-0 ${textAlignClass} ${index < stats.length - 1 ? 'mr-8 pr-8' : ''}`}
                                        style={{
                                            borderRight:
                                                index < stats.length - 1
                                                    ? '0.5px solid rgba(232,217,138,0.2)'
                                                    : 'none',
                                        }}
                                    >
                                        <div className="text-2xl" style={{ color: palette.gold }}>
                                            {stat[0]}
                                        </div>
                                        <div
                                            className="mt-1 text-xs uppercase tracking-[0.15em]"
                                            style={{
                                                fontFamily: "'Helvetica Neue', sans-serif",
                                                color: 'rgba(255,255,255,0.4)',
                                            }}
                                        >
                                            {stat[1]}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <div className="border-b bg-white" style={{ borderColor: palette.cardBorder }}>
                        <div className={`flex w-full overflow-x-auto px-4 sm:px-6 lg:px-10 ${justifyClass}`}>
                            {enrichedDepartments.map((department) => (
                                <button
                                    key={department.tabId}
                                    type="button"
                                    onClick={() => {
                                        setActiveDept(department.tabId);
                                        setSearch('');
                                    }}
                                    className="cursor-pointer shrink-0 px-5 py-4 text-xs uppercase tracking-[0.15em] transition-all duration-200"
                                    style={{
                                        fontFamily: "'Helvetica Neue', sans-serif",
                                        color: activeDept === department.tabId ? palette.navy : palette.muted,
                                        fontWeight: activeDept === department.tabId ? 500 : 400,
                                        borderBottom:
                                            activeDept === department.tabId
                                                ? `2px solid ${palette.red}`
                                                : '2px solid transparent',
                                    }}
                                >
                                    {department.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <main style={{ background: palette.lightBg, minHeight: '60vh' }}>
                        <div className="px-4 py-9 sm:px-6 lg:px-10">
                            {searchResults ? (
                                <>
                                    <div
                                        className={`mb-5 text-xs uppercase tracking-[0.15em] ${textAlignClass}`}
                                        style={{ fontFamily: "'Helvetica Neue', sans-serif", color: palette.muted }}
                                    >
                                        {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{search}"
                                    </div>

                                    <div
                                        className={`grid gap-2.5 ${studentGridJustifyClass}`}
                                        style={{ gridTemplateColumns: studentGridTemplateColumns }}
                                    >
                                        {searchResults.map((student) => (
                                            <StudentCard
                                                key={student.id}
                                                student={student}
                                                alignment={contentAlignment}
                                                reaction={getReactionState('student', student)}
                                                onClick={() => openCardModal('student', searchResults, student.id)}
                                            />
                                        ))}
                                    </div>
                                </>
                            ) : activeDepartment ? (
                                <>
                                    <div
                                        className="mb-7 border border-l-4 bg-white p-6"
                                        style={{ borderColor: palette.cardBorder, borderLeftColor: palette.red }}
                                    >
                                        <div
                                            className={`mb-1.5 text-xs uppercase tracking-[0.2em] ${textAlignClass}`}
                                            style={{ fontFamily: "'Helvetica Neue', sans-serif", color: palette.red }}
                                        >
                                            {activeDepartment.label}
                                        </div>
                                        <div
                                            className={`mb-1.5 text-2xl font-normal ${textAlignClass}`}
                                            style={{ color: palette.navy, letterSpacing: '0.5px' }}
                                        >
                                            {activeDepartment.full_name}
                                        </div>
                                        <div
                                            className={`text-sm leading-relaxed ${textAlignClass}`}
                                            style={{ fontFamily: "'Helvetica Neue', sans-serif", color: '#6b7280' }}
                                        >
                                            {activeDepartment.description}
                                        </div>
                                    </div>

                                    <DepartmentGroupPhotoSlider
                                        photos={activeDepartmentGroupPhotos}
                                        alignment={contentAlignment}
                                        label={`Group Photos · ${activeDepartment.label}`}
                                    />

                                    <SectionDivider label="Faculty" alignment={contentAlignment} />
                                    <div
                                        className={`mb-10 grid gap-2.5 ${facultyGridJustifyClass}`}
                                        style={{ gridTemplateColumns: facultyGridTemplateColumns }}
                                    >
                                        {activeDepartment.faculty.map((faculty) => (
                                            <FacultyCard
                                                key={faculty.id}
                                                faculty={faculty}
                                                alignment={contentAlignment}
                                                reaction={getReactionState('faculty', faculty)}
                                                onClick={() => openCardModal('faculty', activeDepartment.faculty, faculty.id)}
                                            />
                                        ))}
                                    </div>

                                    <SectionDivider
                                        label={`Graduates · ${activeDepartment.label} · Class of ${yearbook.graduating_year}`}
                                        alignment={contentAlignment}
                                    />
                                    <div
                                        className={`grid gap-2.5 ${studentGridJustifyClass}`}
                                        style={{ gridTemplateColumns: studentGridTemplateColumns }}
                                    >
                                        {activeDepartment.students.map((student) => (
                                            <StudentCard
                                                key={student.id}
                                                student={student}
                                                alignment={contentAlignment}
                                                reaction={getReactionState('student', student)}
                                                onClick={() => openCardModal('student', activeDepartment.students, student.id)}
                                            />
                                        ))}
                                    </div>
                                </>
                            ) : null}
                        </div>
                    </main>

                    <footer
                        className="border-t-2"
                        style={{ background: palette.navy, borderColor: palette.goldDark }}
                    >
                        <div className="flex w-full items-center justify-between px-4 py-5 sm:px-6 lg:px-10">
                            <div
                                className="text-xs uppercase tracking-[0.2em]"
                                style={{ fontFamily: "'Helvetica Neue', sans-serif", color: palette.gold }}
                            >
                                {schoolName}
                            </div>
                            <div
                                className="text-xs"
                                style={{
                                    fontFamily: "'Helvetica Neue', sans-serif",
                                    color: 'rgba(255,255,255,0.35)',
                                    letterSpacing: '1px',
                                }}
                            >
                                YEARBOOK {yearbook.graduating_year} · ALL RIGHTS RESERVED
                            </div>
                        </div>
                    </footer>
                </>
            ) : (
                <BookView
                    logo={<DVCLogo />}
                    schoolName={schoolName}
                    yearbook={yearbook}
                    departments={enrichedDepartments}
                    activeDept={activeDept}
                    onActiveDeptChange={setActiveDept}
                    search={search}
                    onSearchChange={setSearch}
                    onOpenCardModal={openCardModal}
                />
            )}

            <CardModal
                open={modalState.open}
                onOpenChange={(nextOpen) =>
                    setModalState((currentState) => ({
                        ...currentState,
                        open: nextOpen,
                    }))
                }
                type={modalState.type}
                items={modalState.items}
                activeIndex={modalState.activeIndex}
                onActiveIndexChange={handleModalIndexChange}
                alignment={contentAlignment}
                reactionsByKey={reactionsByKey}
                reactionLoadingByKey={reactionLoadingByKey}
                onToggleReaction={(targetId) => handleToggleReaction(modalState.type, targetId)}
            />
        </div>
    );
}
