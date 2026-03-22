import { yearbookPalette as palette } from '@/lib/theme';
import { cn } from '@/lib/utils';

const STUDENT_PLACEHOLDER = 'https://via.placeholder.com/360x480?text=Student';

function photoOrPlaceholder(photo) {
    if (typeof photo !== 'string') {
        return STUDENT_PLACEHOLDER;
    }

    const trimmed = photo.trim();

    return trimmed !== '' ? trimmed : STUDENT_PLACEHOLDER;
}

export default function StudentCard({ student, compact = false, alignment = 'left', className, onClick }) {
    const textAlignClass =
        alignment === 'center' ? 'text-center' : alignment === 'right' ? 'text-right' : 'text-left';
    const interactiveClass = onClick ? 'cursor-pointer hover:-translate-y-0.5' : '';

    if (onClick) {
        return (
            <button
                type="button"
                onClick={onClick}
                className={cn(
                    'group w-full overflow-hidden border bg-white text-left shadow-sm transition-all duration-200 hover:shadow-md',
                    interactiveClass,
                    compact ? 'max-w-[260px]' : 'max-w-[320px]',
                    className,
                )}
                style={{ borderColor: palette.cardBorder }}
            >
                <div className="relative w-full overflow-hidden" style={{ aspectRatio: '3 / 4', background: '#e8eaf2' }}>
                    <img
                        src={photoOrPlaceholder(student?.photo)}
                        alt={student?.name || 'Student'}
                        className="h-full w-full object-cover grayscale-[10%] transition-all duration-300 group-hover:grayscale-0"
                        onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = STUDENT_PLACEHOLDER;
                        }}
                    />

                    <div
                        className={cn('absolute inset-x-0 bottom-0 px-3 pb-3 pt-10', textAlignClass)}
                        style={{ background: `linear-gradient(transparent, ${palette.navy}eb)` }}
                    >
                        <div className="mb-1 text-sm text-white" style={{ letterSpacing: '0.4px' }}>
                            {student?.name || 'Student Name'}
                        </div>

                        {student?.motto ? (
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

                        {student?.badge ? (
                            <span
                                className="inline-block border px-2 py-1 text-[9px] uppercase"
                                style={{
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

    return (
        <article
            className={cn(
                'group w-full overflow-hidden border bg-white shadow-sm transition-all duration-200 hover:shadow-md',
                compact ? 'max-w-[260px]' : 'max-w-[320px]',
                className,
            )}
            style={{ borderColor: palette.cardBorder }}
        >
            <div className="relative w-full overflow-hidden" style={{ aspectRatio: '3 / 4', background: '#e8eaf2' }}>
                <img
                    src={photoOrPlaceholder(student?.photo)}
                    alt={student?.name || 'Student'}
                    className="h-full w-full object-cover grayscale-[10%] transition-all duration-300 group-hover:grayscale-0"
                    onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = STUDENT_PLACEHOLDER;
                    }}
                />

                <div
                    className={cn('absolute inset-x-0 bottom-0 px-3 pb-3 pt-10', textAlignClass)}
                    style={{ background: `linear-gradient(transparent, ${palette.navy}eb)` }}
                >
                    <div className="mb-1 text-sm text-white" style={{ letterSpacing: '0.4px' }}>
                        {student?.name || 'Student Name'}
                    </div>

                    {student?.motto ? (
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

                    {student?.badge ? (
                        <span
                            className="inline-block border px-2 py-1 text-[9px] uppercase"
                            style={{
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
        </article>
    );
}
