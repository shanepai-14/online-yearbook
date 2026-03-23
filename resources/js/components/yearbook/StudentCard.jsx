import { yearbookPalette as palette } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { getStudentPlaceholder, resolveStudentPhoto } from '@/lib/placeholders';

function withHexAlpha(color, alphaHex = 'eb') {
    if (typeof color !== 'string') {
        return `${palette.navy}${alphaHex}`;
    }

    const value = color.trim();

    if (/^#[0-9a-fA-F]{6}$/.test(value)) {
        return `${value}${alphaHex}`;
    }

    if (/^#[0-9a-fA-F]{3}$/.test(value)) {
        const expanded = `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
        return `${expanded}${alphaHex}`;
    }

    return value || `${palette.navy}${alphaHex}`;
}

export default function StudentCard({
    student,
    compact = false,
    alignment = 'left',
    gradientColor = palette.navy,
    showFrame = true,
    className,
    onClick,
}) {
    const textAlignClass =
        alignment === 'center' ? 'text-center' : alignment === 'right' ? 'text-right' : 'text-left';
    const interactiveClass = onClick ? 'cursor-pointer hover:-translate-y-0.5' : '';
    const overlayEndColor = withHexAlpha(gradientColor);

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
                style={{ borderColor: showFrame ? palette.cardBorder : 'transparent' }}
            >
                <div className="relative w-full overflow-hidden" style={{ aspectRatio: '3 / 4', background: '#e8eaf2' }}>
                    <img
                        src={resolveStudentPhoto(student?.photo, student?.gender)}
                        alt={student?.name || 'Student'}
                        className="h-full w-full object-cover grayscale-[10%] transition-all duration-300 group-hover:grayscale-0"
                        onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = getStudentPlaceholder(student?.gender);
                        }}
                    />

                    <div
                        className={cn('absolute inset-x-0 bottom-0 px-3 pb-3 pt-10', textAlignClass)}
                        style={{ background: `linear-gradient(transparent, ${overlayEndColor})` }}
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
            style={{ borderColor: showFrame ? palette.cardBorder : 'transparent' }}
        >
            <div className="relative w-full overflow-hidden" style={{ aspectRatio: '3 / 4', background: '#e8eaf2' }}>
                <img
                    src={resolveStudentPhoto(student?.photo, student?.gender)}
                    alt={student?.name || 'Student'}
                    className="h-full w-full object-cover grayscale-[10%] transition-all duration-300 group-hover:grayscale-0"
                    onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = getStudentPlaceholder(student?.gender);
                    }}
                />

                <div
                    className={cn('absolute inset-x-0 bottom-0 px-3 pb-3 pt-10', textAlignClass)}
                    style={{ background: `linear-gradient(transparent, ${overlayEndColor})` }}
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
