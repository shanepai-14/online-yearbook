import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';

import { yearbookPalette as palette } from '@/lib/theme';
import { cn } from '@/lib/utils';

const FACULTY_PLACEHOLDER = 'https://via.placeholder.com/320x320?text=Faculty';
const STUDENT_PLACEHOLDER = 'https://via.placeholder.com/360x480?text=Student';

const SPINE_WIDTH = 18;
const FLIP_DURATION_MS = 600;
const DRAG_FLIP_THRESHOLD = 60;

function photoOrPlaceholder(photo, placeholder) {
    if (typeof photo !== 'string') {
        return placeholder;
    }

    const trimmed = photo.trim();

    return trimmed !== '' ? trimmed : placeholder;
}

function isInteractiveTarget(target) {
    if (!(target instanceof Element)) {
        return false;
    }

    return Boolean(target.closest('button, a, input, textarea, select, [data-no-book-drag="true"]'));
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
}

function chunk(items, size) {
    const source = Array.isArray(items) ? items : [];
    const output = [];

    for (let index = 0; index < source.length; index += size) {
        output.push(source.slice(index, index + size));
    }

    return output;
}

function isStudentMatch(student, departmentLabel, rawSearch) {
    const normalizedSearch = rawSearch.trim().toLowerCase();

    if (normalizedSearch === '') {
        return true;
    }

    return `${student.name} ${departmentLabel}`.toLowerCase().includes(normalizedSearch);
}

function withPageNumbers(spreads) {
    let pageNumber = 1;

    const isNumberedPage = (pageType) => !['board', 'blank'].includes(pageType);

    return spreads.map((spread) => ({
        ...spread,
        left: {
            ...spread.left,
            pageNumber: isNumberedPage(spread.left.type) ? pageNumber++ : null,
        },
        right: {
            ...spread.right,
            pageNumber: isNumberedPage(spread.right.type) ? pageNumber++ : null,
        },
    }));
}

function buildDepartmentSpreads({ department, schoolName, graduatingYear, search }) {
    if (!department) {
        return [];
    }

    const filteredStudents = department.students.filter((student) =>
        isStudentMatch(student, department.label, search),
    );

    const spreads = [
        {
            id: 'cover-spread',
            left: { type: 'board' },
            right: {
                type: 'cover',
                schoolName,
                graduatingYear,
            },
        },
        {
            id: 'intro-spread',
            left: {
                type: 'intro',
                department,
            },
            right: { type: 'blank' },
        },
    ];

    const facultySpreadGroups = chunk(department.faculty, 8);

    facultySpreadGroups.forEach((group, index) => {
        spreads.push({
            id: `faculty-spread-${index}`,
            left: {
                type: 'faculty-grid',
                departmentLabel: department.label,
                items: group.slice(0, 4),
                modalItems: department.faculty,
            },
            right:
                group.slice(4, 8).length > 0
                    ? {
                          type: 'faculty-grid',
                          departmentLabel: department.label,
                          items: group.slice(4, 8),
                          modalItems: department.faculty,
                      }
                    : { type: 'blank' },
        });
    });

    const studentSpreadGroups = chunk(filteredStudents, 12);

    if (studentSpreadGroups.length === 0) {
        spreads.push({
            id: 'students-empty-spread',
            left: {
                type: 'students-empty',
                departmentLabel: department.label,
                search,
            },
            right: { type: 'blank' },
        });
    } else {
        studentSpreadGroups.forEach((group, index) => {
            spreads.push({
                id: `student-spread-${index}`,
                left: {
                    type: 'student-grid',
                    departmentLabel: department.label,
                    items: group.slice(0, 6),
                    modalItems: filteredStudents,
                },
                right:
                    group.slice(6, 12).length > 0
                        ? {
                              type: 'student-grid',
                              departmentLabel: department.label,
                              items: group.slice(6, 12),
                              modalItems: filteredStudents,
                          }
                        : { type: 'blank' },
            });
        });
    }

    spreads.push({
        id: 'back-cover-spread',
        left: { type: 'board' },
        right: {
            type: 'back-cover',
            schoolName,
        },
    });

    return withPageNumbers(spreads);
}

function FacultyCell({ item, onOpenCard }) {
    return (
        <button
            type="button"
            className="group overflow-hidden rounded-md border border-slate-300 bg-white text-center transition hover:shadow-md"
            onClick={onOpenCard}
        >
            <div className="aspect-square overflow-hidden bg-slate-100">
                <img
                    src={photoOrPlaceholder(item.photo, FACULTY_PLACEHOLDER)}
                    alt={item.name}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    style={{ filter: 'sepia(10%) grayscale(10%)' }}
                    onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = FACULTY_PLACEHOLDER;
                    }}
                />
            </div>
            <div className="border-t-2 px-2 py-2" style={{ borderColor: palette.navy }}>
                <p className="truncate text-xs font-semibold text-slate-900">{item.name}</p>
                <p
                    className="truncate text-[10px] uppercase tracking-[0.08em]"
                    style={{ fontFamily: "'Helvetica Neue', sans-serif", color: palette.red }}
                >
                    {item.role}
                </p>
            </div>
        </button>
    );
}

function StudentCell({ item, onOpenCard }) {
    const heartCount = Number(item.reaction_count ?? 0);
    const isReacted = Boolean(item.reacted_by_viewer);

    return (
        <button
            type="button"
            className="group w-full cursor-pointer overflow-hidden border bg-white text-center transition-all duration-200 hover:shadow-md"
            style={{ borderColor: palette.cardBorder }}
            onClick={onOpenCard}
        >
            <div className="relative w-full overflow-hidden" style={{ aspectRatio: '3 / 4', background: '#e8eaf2' }}>
                <img
                    src={photoOrPlaceholder(item.photo, STUDENT_PLACEHOLDER)}
                    alt={item.name}
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
                    className="absolute bottom-0 left-0 right-0 px-3 pb-3 pt-10 text-center"
                    style={{ background: `linear-gradient(transparent, ${palette.navy}eb)` }}
                >
                    <div className="mb-1 text-sm text-white" style={{ letterSpacing: '0.4px' }}>
                        {item.name}
                    </div>
                    {item.motto ? (
                        <div
                            className="mb-2 px-1 text-xs italic leading-snug"
                            style={{
                                fontFamily: 'Georgia, serif',
                                color: 'rgba(232,217,138,0.85)',
                            }}
                        >
                            "{item.motto}"
                        </div>
                    ) : null}
                    {item.badge ? (
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
                            {item.badge}
                        </span>
                    ) : null}
                </div>
            </div>
        </button>
    );
}

function BookPage({
    page,
    side,
    logo,
    onOpenFacultyCard,
    onOpenStudentCard,
}) {
    const sideInsetShadow =
        side === 'left'
            ? 'inset -8px 0 18px rgba(0,0,0,0.08)'
            : 'inset 8px 0 18px rgba(0,0,0,0.08)';

    const pageNumberClass = side === 'left' ? 'left-4' : 'right-4';

    if (page.type === 'board') {
        return <div className="h-full w-full bg-[#3b2d16]" style={{ boxShadow: sideInsetShadow }} />;
    }

    if (page.type === 'back-cover') {
        return (
            <div
                className="relative h-full w-full px-6 py-8"
                style={{
                    background: palette.navy,
                    boxShadow: sideInsetShadow,
                }}
            >
                <div className="absolute inset-0 opacity-[0.12]">
                    <div className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2">{logo}</div>
                </div>
                <div className="relative z-10 flex h-full items-end justify-end">
                    <p
                        className="text-xs uppercase tracking-[0.2em]"
                        style={{ fontFamily: "'Helvetica Neue', sans-serif", color: '#ffffffaa' }}
                    >
                        {page.schoolName}
                    </p>
                </div>
                {page.pageNumber ? (
                    <p className={cn('absolute bottom-3 text-[11px] text-white/70', pageNumberClass)}>— {page.pageNumber} —</p>
                ) : null}
            </div>
        );
    }

    const parchmentStyle = {
        backgroundColor: '#fdf6e3',
        backgroundImage:
            'linear-gradient(to bottom, rgba(140,113,68,0.13) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.2), rgba(255,255,255,0.2))',
        backgroundSize: '100% 30px, 100% 100%',
        boxShadow: sideInsetShadow,
    };

    if (page.type === 'blank') {
        return <div className="h-full w-full" style={parchmentStyle} />;
    }

    if (page.type === 'cover') {
        return (
            <div className="relative h-full w-full p-6 sm:p-8" style={parchmentStyle}>
                <div
                    className="flex h-full flex-col items-center justify-center rounded-lg border-2 px-4 text-center"
                    style={{ borderColor: '#e8d98a' }}
                >
                    <div className="mb-4 h-20 w-20 rounded-full bg-white p-2 shadow-sm">{logo}</div>
                    <p
                        className="text-xs uppercase tracking-[0.2em]"
                        style={{ fontFamily: "'Helvetica Neue', sans-serif", color: palette.red }}
                    >
                        {page.schoolName}
                    </p>
                    <h2 className="mt-3 text-3xl text-slate-900">Class of {page.graduatingYear}</h2>
                    <div className="mt-4 h-px w-16" style={{ background: '#d5bf74' }} />
                    <p className="mt-4 text-sm text-slate-600">Official Yearbook Edition</p>
                </div>
                {page.pageNumber ? (
                    <p className={cn('absolute bottom-3 text-[11px] text-slate-500', pageNumberClass)}>— {page.pageNumber} —</p>
                ) : null}
            </div>
        );
    }

    if (page.type === 'intro') {
        return (
            <div className="relative h-full w-full px-6 py-8 sm:px-8" style={parchmentStyle}>
                <p
                    className="text-[11px] uppercase tracking-[0.18em]"
                    style={{ fontFamily: "'Helvetica Neue', sans-serif", color: palette.red }}
                >
                    Department Introduction
                </p>
                <h2 className="mt-3 text-2xl text-slate-900">{page.department.full_name}</h2>
                <p
                    className="mt-1 text-xs uppercase tracking-[0.14em]"
                    style={{ fontFamily: "'Helvetica Neue', sans-serif", color: palette.navy }}
                >
                    {page.department.label}
                </p>
                <div className="my-5 h-px w-14" style={{ background: '#c9a950' }} />
                <p className="text-sm leading-relaxed text-slate-700">{page.department.description}</p>
                {page.pageNumber ? (
                    <p className={cn('absolute bottom-3 text-[11px] text-slate-500', pageNumberClass)}>— {page.pageNumber} —</p>
                ) : null}
            </div>
        );
    }

    if (page.type === 'faculty-grid') {
        return (
            <div className="relative h-full w-full px-5 py-6 sm:px-6 sm:py-7" style={parchmentStyle}>
                <p
                    className="text-[11px] uppercase tracking-[0.18em]"
                    style={{ fontFamily: "'Helvetica Neue', sans-serif", color: palette.navy }}
                >
                    Faculty · {page.departmentLabel}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                    {page.items.map((member) => (
                        <FacultyCell
                            key={member.id}
                            item={member}
                            onOpenCard={() => onOpenFacultyCard(member.id, page.modalItems)}
                        />
                    ))}
                </div>
                {page.pageNumber ? (
                    <p className={cn('absolute bottom-3 text-[11px] text-slate-500', pageNumberClass)}>— {page.pageNumber} —</p>
                ) : null}
            </div>
        );
    }

    if (page.type === 'student-grid') {
        return (
            <div className="relative h-full w-full px-4 py-6 sm:px-5 sm:py-7" style={parchmentStyle}>
                <p
                    className="text-[11px] uppercase tracking-[0.18em]"
                    style={{ fontFamily: "'Helvetica Neue', sans-serif", color: palette.navy }}
                >
                    Graduates · {page.departmentLabel}
                </p>
                <div className="mt-4 grid grid-cols-3 gap-2.5">
                    {page.items.map((student) => (
                        <StudentCell
                            key={student.id}
                            item={student}
                            onOpenCard={() => onOpenStudentCard(student.id, page.modalItems)}
                        />
                    ))}
                </div>
                {page.pageNumber ? (
                    <p className={cn('absolute bottom-3 text-[11px] text-slate-500', pageNumberClass)}>— {page.pageNumber} —</p>
                ) : null}
            </div>
        );
    }

    if (page.type === 'students-empty') {
        return (
            <div className="relative h-full w-full px-6 py-8 sm:px-8" style={parchmentStyle}>
                <p
                    className="text-[11px] uppercase tracking-[0.18em]"
                    style={{ fontFamily: "'Helvetica Neue', sans-serif", color: palette.navy }}
                >
                    Graduates · {page.departmentLabel}
                </p>
                <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-white/55 p-5 text-center">
                    <p className="text-sm text-slate-700">No student matches for "{page.search.trim()}".</p>
                    <p className="mt-1 text-xs text-slate-500">Try a different name or department keyword.</p>
                </div>
                {page.pageNumber ? (
                    <p className={cn('absolute bottom-3 text-[11px] text-slate-500', pageNumberClass)}>— {page.pageNumber} —</p>
                ) : null}
            </div>
        );
    }

    return <div className="h-full w-full" style={parchmentStyle} />;
}

function BookSpread({ spread, logo, onOpenCardModal }) {
    const handleOpenFacultyCard = (facultyId, modalItems) => {
        if (typeof onOpenCardModal !== 'function') {
            return;
        }

        onOpenCardModal('faculty', modalItems, facultyId);
    };

    const handleOpenStudentCard = (studentId, modalItems) => {
        if (typeof onOpenCardModal !== 'function') {
            return;
        }

        onOpenCardModal('student', modalItems, studentId);
    };

    return (
        <div
            className="grid h-full w-full overflow-hidden rounded-xl border border-[#7a6132]/60"
            style={{
                gridTemplateColumns: `1fr ${SPINE_WIDTH}px 1fr`,
                boxShadow: '0 28px 52px rgba(0,0,0,0.55)',
            }}
        >
            <BookPage
                page={spread.left}
                side="left"
                logo={logo}
                onOpenFacultyCard={handleOpenFacultyCard}
                onOpenStudentCard={handleOpenStudentCard}
            />

            <div
                className="h-full"
                style={{
                    background:
                        'linear-gradient(90deg, #7d642e 0%, #d7c183 32%, #efdca6 50%, #d7c183 68%, #7d642e 100%)',
                    boxShadow: 'inset 0 0 10px rgba(0,0,0,0.35)',
                }}
            />

            <BookPage
                page={spread.right}
                side="right"
                logo={logo}
                onOpenFacultyCard={handleOpenFacultyCard}
                onOpenStudentCard={handleOpenStudentCard}
            />
        </div>
    );
}

export default function BookView({
    logo,
    schoolName,
    yearbook,
    departments,
    activeDept,
    onActiveDeptChange,
    search,
    onSearchChange,
    onOpenCardModal,
}) {
    const activeDepartment = useMemo(
        () => departments.find((department) => department.tabId === activeDept) ?? departments[0] ?? null,
        [departments, activeDept],
    );

    const [spreadIndex, setSpreadIndex] = useState(0);
    const [flipState, setFlipState] = useState(null);
    const bookViewportRef = useRef(null);
    const flipTimerRef = useRef(null);
    const dragRef = useRef({
        pointerId: null,
        startX: 0,
        deltaX: 0,
    });

    const spreads = useMemo(
        () =>
            buildDepartmentSpreads({
                department: activeDepartment,
                schoolName,
                graduatingYear: yearbook.graduating_year,
                search,
            }),
        [activeDepartment, schoolName, yearbook.graduating_year, search],
    );

    const inlineSearchResults = useMemo(() => {
        if (!activeDepartment) {
            return [];
        }

        return activeDepartment.students.filter((student) =>
            isStudentMatch(student, activeDepartment.label, search),
        );
    }, [activeDepartment, search]);

    useEffect(() => {
        setSpreadIndex(0);
    }, [activeDept]);

    useEffect(() => {
        setSpreadIndex((currentIndex) =>
            clamp(currentIndex, 0, Math.max(spreads.length - 1, 0)),
        );
    }, [spreads.length]);

    useEffect(() => {
        return () => {
            if (flipTimerRef.current) {
                window.clearTimeout(flipTimerRef.current);
            }
        };
    }, []);

    const currentSpread = spreads[spreadIndex] ?? null;
    const targetSpread = flipState ? spreads[flipState.targetIndex] ?? currentSpread : currentSpread;
    const baseSpread = flipState ? targetSpread : currentSpread;

    const canGoPrev = spreadIndex > 0;
    const canGoNext = spreadIndex < spreads.length - 1;

    const clearFlipTimer = () => {
        if (flipTimerRef.current) {
            window.clearTimeout(flipTimerRef.current);
            flipTimerRef.current = null;
        }
    };

    const finishFlipToTarget = (targetIndex) => {
        clearFlipTimer();
        flipTimerRef.current = window.setTimeout(() => {
            setSpreadIndex(targetIndex);
            setFlipState(null);
        }, FLIP_DURATION_MS);
    };

    const cancelFlip = () => {
        clearFlipTimer();
        flipTimerRef.current = window.setTimeout(() => {
            setFlipState(null);
        }, 230);
    };

    const startFlip = (direction) => {
        if (flipState || !currentSpread) {
            return;
        }

        const targetIndex = direction === 'next' ? spreadIndex + 1 : spreadIndex - 1;

        if (targetIndex < 0 || targetIndex >= spreads.length) {
            return;
        }

        setFlipState({
            direction,
            targetIndex,
            angle: 0,
            dragging: false,
        });

        requestAnimationFrame(() => {
            setFlipState((currentState) => {
                if (!currentState || currentState.targetIndex !== targetIndex) {
                    return currentState;
                }

                return {
                    ...currentState,
                    angle: direction === 'next' ? -180 : 180,
                };
            });
        });

        finishFlipToTarget(targetIndex);
    };

    const handlePointerDown = (event) => {
        if (flipState || !currentSpread) {
            return;
        }

        if (isInteractiveTarget(event.target)) {
            return;
        }

        if (event.pointerType === 'mouse' && event.button !== 0) {
            return;
        }

        dragRef.current.pointerId = event.pointerId;
        dragRef.current.startX = event.clientX;
        dragRef.current.deltaX = 0;

        event.currentTarget.setPointerCapture?.(event.pointerId);
    };

    const handlePointerMove = (event) => {
        if (dragRef.current.pointerId !== event.pointerId) {
            return;
        }

        const deltaX = event.clientX - dragRef.current.startX;
        dragRef.current.deltaX = deltaX;

        if (!flipState) {
            if (Math.abs(deltaX) < 6) {
                return;
            }

            const direction = deltaX < 0 ? 'next' : 'prev';
            const targetIndex = direction === 'next' ? spreadIndex + 1 : spreadIndex - 1;

            if (targetIndex < 0 || targetIndex >= spreads.length) {
                return;
            }

            setFlipState({
                direction,
                targetIndex,
                angle: 0,
                dragging: true,
            });
            return;
        }

        if (!flipState.dragging) {
            return;
        }

        const viewportWidth = bookViewportRef.current?.offsetWidth ?? 940;
        const normalized = clamp(Math.abs(deltaX) / Math.max(viewportWidth * 0.55, 280), 0, 1);
        const angle = flipState.direction === 'next' ? -normalized * 180 : normalized * 180;

        setFlipState((currentState) => {
            if (!currentState || !currentState.dragging) {
                return currentState;
            }

            return {
                ...currentState,
                angle,
            };
        });
    };

    const handlePointerEnd = (event) => {
        if (dragRef.current.pointerId !== event.pointerId) {
            return;
        }

        event.currentTarget.releasePointerCapture?.(event.pointerId);
        dragRef.current.pointerId = null;

        if (!flipState || !flipState.dragging) {
            return;
        }

        const deltaX = dragRef.current.deltaX;
        const shouldCommit =
            flipState.direction === 'next'
                ? deltaX <= -DRAG_FLIP_THRESHOLD
                : deltaX >= DRAG_FLIP_THRESHOLD;

        if (shouldCommit) {
            const finalAngle = flipState.direction === 'next' ? -180 : 180;

            setFlipState((currentState) => {
                if (!currentState) {
                    return currentState;
                }

                return {
                    ...currentState,
                    dragging: false,
                    angle: finalAngle,
                };
            });

            finishFlipToTarget(flipState.targetIndex);
            return;
        }

        setFlipState((currentState) => {
            if (!currentState) {
                return currentState;
            }

            return {
                ...currentState,
                dragging: false,
                angle: 0,
            };
        });
        cancelFlip();
    };

    if (!activeDepartment || !currentSpread) {
        return null;
    }

    return (
        <section style={{ background: '#2a2010' }}>
            <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-10">
                <div
                    className="rounded-xl border px-3 py-3 sm:px-4"
                    style={{ borderColor: '#8c6d35', background: 'rgba(36,26,13,0.8)' }}
                >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="h-10 w-10 shrink-0 rounded-full bg-white p-1.5">{logo}</div>
                            <div className="min-w-0">
                                <p className="truncate text-sm text-[#f7e7bf]">{schoolName}</p>
                                <p
                                    className="truncate text-[11px] uppercase tracking-[0.18em] text-[#d2b676]"
                                    style={{ fontFamily: "'Helvetica Neue', sans-serif" }}
                                >
                                    Book View · Class of {yearbook.graduating_year}
                                </p>
                            </div>
                        </div>

                        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-2">
                            {departments.map((department) => {
                                const isActive = department.tabId === activeDepartment.tabId;

                                return (
                                    <button
                                        key={department.tabId}
                                        type="button"
                                        onClick={() => {
                                            onActiveDeptChange(department.tabId);
                                            setSpreadIndex(0);
                                        }}
                                        className="rounded-full px-3 py-1.5 text-xs uppercase tracking-[0.14em] transition"
                                        style={{
                                            fontFamily: "'Helvetica Neue', sans-serif",
                                            background: isActive ? '#e8d98a' : 'rgba(255,255,255,0.08)',
                                            color: isActive ? '#1a2a6c' : '#f9f0d6',
                                            border: isActive ? '1px solid #e8d98a' : '1px solid rgba(255,255,255,0.14)',
                                        }}
                                    >
                                        {department.label}
                                    </button>
                                );
                            })}
                        </div>

                        <input
                            type="text"
                            value={search}
                            onChange={(event) => onSearchChange(event.target.value)}
                            placeholder="Search students..."
                            className="w-full rounded px-3 py-1.5 text-xs sm:w-52"
                            style={{
                                fontFamily: "'Helvetica Neue', sans-serif",
                                background: 'rgba(255,255,255,0.07)',
                                border: '1px solid rgba(255,255,255,0.18)',
                                color: '#f7e7bf',
                            }}
                        />
                    </div>

                    {search.trim() ? (
                        <div
                            className="mt-3 rounded-lg border px-3 py-2 text-xs"
                            style={{ borderColor: '#6b5328', background: 'rgba(20,15,9,0.45)', color: '#eddcb0' }}
                        >
                            {inlineSearchResults.length} student result{inlineSearchResults.length !== 1 ? 's' : ''} in{' '}
                            {activeDepartment.label}
                        </div>
                    ) : null}
                </div>

                <div className="mt-6 overflow-x-auto pb-2">
                    <div className="mx-auto min-w-[780px] max-w-[1120px]" style={{ perspective: '1600px' }}>
                        <div
                            ref={bookViewportRef}
                            className="relative select-none"
                            style={{
                                touchAction: 'pan-y',
                                transformStyle: 'preserve-3d',
                            }}
                            onPointerDown={handlePointerDown}
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerEnd}
                            onPointerCancel={handlePointerEnd}
                        >
                            <div className="absolute inset-x-[14%] -bottom-5 h-10 rounded-full bg-black/45 blur-xl" />

                            <div className="relative aspect-[16/10]">
                                <div className="absolute inset-0">
                                    <BookSpread spread={baseSpread} logo={logo} onOpenCardModal={onOpenCardModal} />
                                </div>

                                {flipState ? (
                                    <div
                                        className="absolute inset-0 pointer-events-none"
                                        style={{
                                            transformStyle: 'preserve-3d',
                                            transformOrigin:
                                                flipState.direction === 'next' ? 'left center' : 'right center',
                                            transform: `rotateY(${flipState.angle}deg)`,
                                            transition: flipState.dragging
                                                ? 'none'
                                                : 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                                        }}
                                    >
                                        <div
                                            className="absolute inset-0"
                                            style={{
                                                backfaceVisibility: 'hidden',
                                                WebkitBackfaceVisibility: 'hidden',
                                            }}
                                        >
                                            <BookSpread
                                                spread={currentSpread}
                                                logo={logo}
                                                onOpenCardModal={onOpenCardModal}
                                            />
                                        </div>

                                        <div
                                            className="absolute inset-0"
                                            style={{
                                                transform: 'rotateY(180deg)',
                                                backfaceVisibility: 'hidden',
                                                WebkitBackfaceVisibility: 'hidden',
                                            }}
                                        >
                                            <BookSpread
                                                spread={targetSpread}
                                                logo={logo}
                                                onOpenCardModal={onOpenCardModal}
                                            />
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-5 flex items-center justify-center gap-3">
                    <button
                        type="button"
                        onClick={() => startFlip('prev')}
                        disabled={!canGoPrev || Boolean(flipState)}
                        className="inline-flex items-center gap-1 rounded-full border px-4 py-2 text-xs uppercase tracking-[0.14em] transition disabled:cursor-not-allowed disabled:opacity-45"
                        style={{
                            fontFamily: "'Helvetica Neue', sans-serif",
                            color: '#f7e7bf',
                            borderColor: '#c7a76388',
                            background: 'rgba(0,0,0,0.2)',
                        }}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Prev
                    </button>

                    <span className="text-xs text-[#f7e7bfcc]">
                        Spread {spreadIndex + 1} of {spreads.length}
                    </span>

                    <button
                        type="button"
                        onClick={() => startFlip('next')}
                        disabled={!canGoNext || Boolean(flipState)}
                        className="inline-flex items-center gap-1 rounded-full border px-4 py-2 text-xs uppercase tracking-[0.14em] transition disabled:cursor-not-allowed disabled:opacity-45"
                        style={{
                            fontFamily: "'Helvetica Neue', sans-serif",
                            color: '#f7e7bf',
                            borderColor: '#c7a76388',
                            background: 'rgba(0,0,0,0.2)',
                        }}
                    >
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </section>
    );
}
