import { useEffect, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Download, MessageCircle, Share2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

import CommentSection from '@/components/yearbook/CommentSection';
import ReactionButton from '@/components/yearbook/ReactionButton';
import SwipeViewer from '@/components/yearbook/SwipeViewer';

const FACULTY_PLACEHOLDER = 'https://via.placeholder.com/720x720?text=Faculty';
const STUDENT_PLACEHOLDER = 'https://via.placeholder.com/720x960?text=Student';
const CARD_OVERLAY_GOLD = 'rgba(232,217,138,0.9)';
const CARD_OVERLAY_GOLD_SOFT = 'rgba(232,217,138,0.85)';

function photoOrPlaceholder(photo, placeholder) {
    if (typeof photo !== 'string') {
        return placeholder;
    }

    const trimmed = photo.trim();

    return trimmed !== '' ? trimmed : placeholder;
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
}

function sanitizeFileName(value) {
    return String(value || 'profile')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function triggerDownload(url, fileName) {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
}

function loadImageForCanvas(sourceUrl) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = sourceUrl;
    });
}

function drawWrappedText(context, text, x, startY, maxWidth, lineHeight, maxLines) {
    const words = String(text || '').split(/\s+/).filter(Boolean);
    const lines = [];
    let currentLine = '';

    words.forEach((word) => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = context.measureText(testLine).width;

        if (testWidth > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    });

    if (currentLine) {
        lines.push(currentLine);
    }

    const outputLines = lines.slice(0, Math.max(1, maxLines));
    let y = startY;

    outputLines.forEach((line, index) => {
        const isLastVisibleLine = index === outputLines.length - 1;
        const hasMoreLines = lines.length > outputLines.length;
        const rendered = isLastVisibleLine && hasMoreLines ? `${line}...` : line;
        context.fillText(rendered, x, y);
        y += lineHeight;
    });

    return y;
}

function CardDetailPanel({
    item,
    type,
    alignment,
    reaction,
    reactionLoading,
    onToggleReaction,
    commentsEnabled,
    allowReactionsAndComments = true,
    isMobile = false,
    onOpenComments,
}) {
    const textAlignClass =
        alignment === 'center' ? 'text-center' : alignment === 'right' ? 'text-right' : 'text-left';
    const actionAlignClass =
        alignment === 'center' ? 'justify-center' : alignment === 'right' ? 'justify-end' : 'justify-start';
    const placeholder = type === 'student' ? STUDENT_PLACEHOLDER : FACULTY_PLACEHOLDER;
    const [shareFeedback, setShareFeedback] = useState('');
    const [downloadFeedback, setDownloadFeedback] = useState('');

    useEffect(() => {
        if (shareFeedback === '') {
            return undefined;
        }

        const timeoutId = window.setTimeout(() => {
            setShareFeedback('');
        }, 1800);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [shareFeedback]);

    useEffect(() => {
        if (downloadFeedback === '') {
            return undefined;
        }

        const timeoutId = window.setTimeout(() => {
            setDownloadFeedback('');
        }, 1800);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [downloadFeedback]);

    const handleShare = async () => {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('profileType', type);
        currentUrl.searchParams.set('profileId', String(item.id));

        const payload = {
            title: `${item.name} · ${type === 'student' ? 'Graduate' : 'Faculty'} Profile`,
            text:
                type === 'student'
                    ? item.motto || 'View this graduate profile.'
                    : item.role || 'View this faculty profile.',
            url: currentUrl.toString(),
        };

        try {
            if (navigator.share) {
                await navigator.share(payload);
                setShareFeedback('shared');
                return;
            }
        } catch (error) {
            if (error?.name === 'AbortError') {
                return;
            }
        }

        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(payload.url);
                setShareFeedback('copied');
                return;
            }
        } catch (_error) {
            // Fallback to prompt below.
        }

        window.prompt('Copy this link:', payload.url);
        setShareFeedback('copied');
    };

    const shareLabel = shareFeedback === 'copied' ? 'Copied' : shareFeedback === 'shared' ? 'Shared' : 'Share';
    const downloadLabel = downloadFeedback === 'saved' ? 'Saved' : downloadFeedback === 'opened' ? 'Opened' : 'Download';

const handleDownload = async () => {
    const sourceUrl = photoOrPlaceholder(item.photo, placeholder);
    const fileBase = sanitizeFileName(item.name) || 'profile';
    const fileName = `${fileBase}-${type}-card.png`;

    try {
        const image = await loadImageForCanvas(sourceUrl);
        const width  = image.naturalWidth  || image.width  || 720;
        const height = image.naturalHeight || image.height || (type === 'student' ? 960 : 720);

        const canvas = document.createElement('canvas');
        canvas.width  = width;
        canvas.height = height;

        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas context unavailable.');

        context.drawImage(image, 0, 0, width, height);

        // ── Sizing constants ─────────────────────────────────────────────
        const shortSide          = Math.min(width, height);
        const horizontalPadding  = clamp(shortSide * 0.06, 28, 72);
        const availableTextWidth = width - horizontalPadding * 2;
        const textX              = width / 2;

        const nameSize      = clamp(shortSide * 0.038, 18, 36);
        const subTextSize   = clamp(shortSide * 0.024, 12, 22);
        const badgeTextSize = clamp(shortSide * 0.016, 10, 16);
        const lineHeightName = Math.round(nameSize  * 1.2);
        const lineHeightSub  = Math.round(subTextSize * 1.3);
        const badgePaddingX  = clamp(shortSide * 0.018, 10, 18);
        const badgePaddingY  = clamp(shortSide * 0.012,  7, 14);
        const badgeHeight    = badgeTextSize + badgePaddingY * 2;
        const badgeGap       = clamp(shortSide * 0.018, 10, 24);
        const bottomMargin   = clamp(height   * 0.07,  48, 100);

        const nameFont  = `600 ${nameSize}px Georgia, serif`;
        const subFont   = `400 ${subTextSize}px Georgia, serif`;
        const roleFont  = `500 ${subTextSize}px "Helvetica Neue", Arial, sans-serif`;
        const badgeFont = `600 ${badgeTextSize}px "Helvetica Neue", Arial, sans-serif`;

        // ── Dry-run: measure actual wrapped line counts ───────────────────
        context.textAlign    = 'center';
        context.textBaseline = 'top';

        function measureLines(text, font, maxW, maxLines) {
            context.font = font;
            const words = String(text || '').split(/\s+/).filter(Boolean);
            const lines  = [];
            let cur = '';
            words.forEach((w) => {
                const test = cur ? `${cur} ${w}` : w;
                if (context.measureText(test).width > maxW && cur) {
                    lines.push(cur);
                    cur = w;
                } else {
                    cur = test;
                }
            });
            if (cur) lines.push(cur);
            return Math.min(lines.length, Math.max(1, maxLines));
        }

        let blockHeight = measureLines(item.name, nameFont, availableTextWidth, 2) * lineHeightName;

        if (type === 'student') {
            if (item.motto) {
                blockHeight += Math.round(subTextSize * 0.2);
                blockHeight += measureLines(`"${item.motto}"`, subFont, availableTextWidth, 3) * lineHeightSub;
            }
            if (item.badge) {
                blockHeight += badgeGap + badgeHeight;
            }
        } else if (item.role) {
            blockHeight += Math.round(subTextSize * 0.2);
            blockHeight += measureLines(item.role, roleFont, availableTextWidth, 2) * lineHeightSub;
        }

        // ── cursorY anchored to bottom ────────────────────────────────────
        const cursorYStart = height - bottomMargin - blockHeight;

        // ── Gradient: anchored just above the text block ──────────────────
        const gradientBuffer = clamp(height * 0.22, 120, 320);
        const gradientTop    = Math.max(0, cursorYStart - gradientBuffer);

        const gradient = context.createLinearGradient(0, gradientTop, 0, height);
        gradient.addColorStop(0,    'rgba(26,42,108,0)');
        gradient.addColorStop(0.25, 'rgba(26,42,108,0.35)');
        gradient.addColorStop(0.6,  'rgba(26,42,108,0.75)');
        gradient.addColorStop(1,    'rgba(26,42,108,0.96)');
        context.fillStyle = gradient;
        context.fillRect(0, gradientTop, width, height - gradientTop);

        // ── Draw pass ─────────────────────────────────────────────────────
        let cursorY = cursorYStart;

        context.fillStyle = '#ffffff';
        context.font      = nameFont;
        cursorY = drawWrappedText(context, item.name, textX, cursorY, availableTextWidth, lineHeightName, 2);

        if (type === 'student') {
            if (item.motto) {
                context.fillStyle = CARD_OVERLAY_GOLD_SOFT;
                context.font      = subFont;
                cursorY += Math.round(subTextSize * 0.2);
                cursorY = drawWrappedText(
                    context,
                    `"${item.motto}"`,
                    textX,
                    cursorY,
                    availableTextWidth,
                    lineHeightSub,
                    3,
                );
            }

            if (item.badge) {
                const badgeText      = String(item.badge).toUpperCase();
                context.font         = badgeFont;
                const badgeTextWidth = context.measureText(badgeText).width;
                const badgeWidth     = badgeTextWidth + badgePaddingX * 2;
                const badgeY         = cursorY + badgeGap;
                const badgeX         = textX - badgeWidth / 2;

                context.strokeStyle = CARD_OVERLAY_GOLD;
                context.lineWidth   = Math.max(1, Math.round(width * 0.002));
                context.strokeRect(badgeX, badgeY, badgeWidth, badgeHeight);
                context.fillStyle = CARD_OVERLAY_GOLD;
                context.fillText(badgeText, textX, badgeY + badgePaddingY);
            }
        } else if (item.role) {
            context.fillStyle = CARD_OVERLAY_GOLD;
            context.font      = roleFont;
            cursorY += Math.round(subTextSize * 0.2);
            drawWrappedText(context, item.role, textX, cursorY, availableTextWidth, lineHeightSub, 2);
        }

        const outputUrl = canvas.toDataURL('image/png');
        triggerDownload(outputUrl, fileName);
        setDownloadFeedback('saved');
        return;
    } catch (_error) {
        // CORS fallback
    }

    try {
        triggerDownload(sourceUrl, fileName);
        setDownloadFeedback('opened');
    } catch (_error) {
        window.open(sourceUrl, '_blank', 'noopener,noreferrer');
        setDownloadFeedback('opened');
    }
};

    return (
        <article className="flex h-full w-full flex-col md:flex-row">
            <div className="group relative h-[52dvh] w-full bg-black md:h-full md:flex-1">


<div className="absolute inset-0 flex items-center justify-center p-2 md:p-4">
    {/* 
      Grid trick: a 1×1 grid where every child occupies the same cell.
      The <img> sizes the cell; the overlay layers are clamped to it.
      overflow-hidden clips anything that would escape the image bounds.
      max-h is capped to the viewport so tall images never push the
      bottom off-screen (mirrors Facebook's lightbox behaviour).
    */}
    <div
        className="relative grid overflow-hidden"
        style={{
            gridTemplateAreas: "'stack'",
            gridTemplateRows: "1fr",
            gridTemplateColumns: "1fr",
            maxWidth: "100%",
            maxHeight: "min(100%, 85dvh)",
            width: "auto",
            height: "auto",
        }}
    >
        {/* Image — defines the cell size, capped to the viewport */}
        <img
            src={photoOrPlaceholder(item.photo, placeholder)}
            alt={item.name}
            loading="lazy"
            className="block object-contain"
            style={{
                gridArea: "stack",
                maxWidth: "100%",
                maxHeight: "min(100%, 85dvh)",
                width: "auto",
                height: "auto",
            }}
            onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = placeholder;
            }}
        />

        {/* Gradient overlay — now constrained to the image cell */}
        <div
            className="pointer-events-none h-[45%] self-end transition-all duration-300 md:group-hover:translate-y-2 md:group-hover:opacity-0"
            style={{
                gridArea: "stack",
                background: "linear-gradient(to top, #1a2a6ceb, #1a2a6ca8 45%, transparent)",
                zIndex: 1,
            }}
            aria-hidden="true"
        />

        {/* Text overlay — sits above gradient via zIndex */}
        <div
            className={cn(
                "pointer-events-none self-end px-4 pb-4",
                textAlignClass,
            )}
            style={{ gridArea: "stack", zIndex: 2 }}
        >
            <div
                className="text-white"
                style={{
                    letterSpacing: "0.4px",
                    fontSize: "clamp(0.95rem, 1.45vw, 1.45rem)",
                }}
            >
                {item.name}
            </div>

            {type === "student" ? (
                <>
                    {item.motto ? (
                        <div
                            className="mt-1 italic leading-snug"
                            style={{
                                fontFamily: "Georgia, serif",
                                color: "rgba(232,217,138,0.85)",
                                fontSize: "clamp(0.72rem, 1.05vw, 1rem)",
                            }}
                        >
                            "{item.motto}"
                        </div>
                    ) : null}
                    {item.badge ? (
                        <span
                            className="mt-2 inline-block border px-2 py-1 uppercase tracking-[0.14em]"
                            style={{
                                fontFamily: "'Helvetica Neue', sans-serif",
                                color: "rgba(232,217,138,0.9)",
                                borderColor: "rgba(232,217,138,0.9)",
                                fontSize: "clamp(0.52rem, 0.72vw, 0.75rem)",
                            }}
                        >
                            {item.badge}
                        </span>
                    ) : null}
                </>
            ) : (
                <div
                    className="mt-1"
                    style={{
                        fontFamily: "'Helvetica Neue', sans-serif",
                        color: "rgba(232,217,138,0.9)",
                        letterSpacing: "0.08em",
                        fontSize: "clamp(0.68rem, 0.9vw, 0.9rem)",
                    }}
                >
                    {item.role}
                </div>
            )}
        </div>
    </div>
</div>
            </div>

            <div className="flex h-[48dvh] w-full flex-col bg-white p-4 md:h-full md:w-[430px] md:p-6">
                <div className={cn('space-y-2', textAlignClass)}>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                        {type === 'student' ? 'Graduate Profile' : 'Faculty Profile'}
                    </p>
                    <h2 className="text-2xl font-semibold text-slate-900">{item.name}</h2>

                    {type === 'student' ? (
                        <>
                            {item.motto ? (
                                <p className="text-sm italic leading-relaxed text-slate-600">"{item.motto}"</p>
                            ) : (
                                <p className="text-sm text-slate-500">No motto provided.</p>
                            )}
                            {item.badge ? (
                                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{item.badge}</p>
                            ) : null}
                        </>
                    ) : (
                        <p className="text-sm text-slate-600">{item.role}</p>
                    )}
                </div>

                <div className={cn('mt-4 flex items-center gap-2', actionAlignClass)}>
                    <ReactionButton
                        count={reaction.total}
                        reacted={reaction.reacted}
                        disabled={reactionLoading || !allowReactionsAndComments}
                        onToggle={onToggleReaction}
                    />

                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleShare}
                        className="h-9 rounded-full px-3 text-xs tracking-wide"
                    >
                        <Share2 className="mr-1 h-4 w-4" />
                        {shareLabel}
                    </Button>

                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleDownload}
                        className="h-9 rounded-full px-3 text-xs tracking-wide"
                    >
                        <Download className="mr-1 h-4 w-4" />
                        {downloadLabel}
                    </Button>

                    {isMobile ? (
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={onOpenComments}
                            disabled={!onOpenComments}
                            className="h-9 rounded-full px-3 text-xs tracking-wide"
                        >
                            <MessageCircle className="mr-1 h-4 w-4" />
                            Comments
                        </Button>
                    ) : null}
                </div>

                {!isMobile ? (
                    <div className="mt-4 min-h-0 flex-1">
                        <CommentSection
                            type={type}
                            targetId={item.id}
                            enabled={commentsEnabled}
                            allowSubmit={allowReactionsAndComments}
                        />
                    </div>
                ) : null}
            </div>
        </article>
    );
}

export default function CardModal({
    open,
    onOpenChange,
    type,
    items,
    activeIndex,
    onActiveIndexChange,
    alignment = 'left',
    reactionsByKey,
    reactionLoadingByKey,
    onToggleReaction,
    allowReactionsAndComments = true,
}) {
    const activeItem = items[activeIndex] ?? null;
    const [mobileCommentsOpen, setMobileCommentsOpen] = useState(false);
    const canGoPrev = activeIndex > 0;
    const canGoNext = activeIndex < items.length - 1;

    useEffect(() => {
        if (!open) {
            setMobileCommentsOpen(false);
        }
    }, [open]);

    useEffect(() => {
        setMobileCommentsOpen(false);
    }, [activeIndex, type]);

    const getReactionState = (item) => {
        const reactionKey = `${type}:${item.id}`;

        return (
            reactionsByKey[reactionKey] ?? {
                total: Number(item.reaction_count || 0),
                reacted: Boolean(item.reacted_by_viewer),
            }
        );
    };

    const isReactionLoading = (item) => {
        const reactionKey = `${type}:${item.id}`;
        return Boolean(reactionLoadingByKey[reactionKey]);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-transparent">
                <div className="relative h-full w-full">
                    <DialogClose
                        aria-label="Close profile"
                        className="absolute right-3 top-3 z-20 h-10 w-10 rounded-full bg-black/60 text-white hover:bg-black/80"
                    >
                        <X className="h-5 w-5" />
                    </DialogClose>

                    <div className="absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-xs text-white">
                        {items.length > 0 ? `${activeIndex + 1} / ${items.length}` : '0 / 0'}
                    </div>

                    <button
                        type="button"
                        onClick={() => onActiveIndexChange(activeIndex - 1)}
                        disabled={!canGoPrev}
                        className="absolute left-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/75 disabled:cursor-not-allowed disabled:opacity-40 md:flex"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>

                    <button
                        type="button"
                        onClick={() => onActiveIndexChange(activeIndex + 1)}
                        disabled={!canGoNext}
                        className="absolute right-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/75 disabled:cursor-not-allowed disabled:opacity-40 md:flex"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>

                    <div className="hidden h-full w-full md:block">
                        {activeItem ? (
                            <CardDetailPanel
                                item={activeItem}
                                type={type}
                                alignment={alignment}
                                reaction={getReactionState(activeItem)}
                                reactionLoading={isReactionLoading(activeItem)}
                                onToggleReaction={() => onToggleReaction(activeItem.id)}
                                commentsEnabled
                                allowReactionsAndComments={allowReactionsAndComments}
                            />
                        ) : null}
                    </div>

                    <div className="h-full w-full md:hidden">
                        <SwipeViewer
                            items={items}
                            activeIndex={activeIndex}
                            onActiveIndexChange={onActiveIndexChange}
                            renderItem={(item, _index, isActive) => (
                                <CardDetailPanel
                                    item={item}
                                    type={type}
                                    alignment={alignment}
                                    reaction={getReactionState(item)}
                                    reactionLoading={isReactionLoading(item)}
                                    onToggleReaction={() => onToggleReaction(item.id)}
                                    commentsEnabled={isActive}
                                    allowReactionsAndComments={allowReactionsAndComments}
                                    isMobile
                                    onOpenComments={isActive ? () => setMobileCommentsOpen(true) : undefined}
                                />
                            )}
                        />

                        <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-white">
                            <span className="inline-flex items-center gap-1">
                                <ChevronUp className="h-3.5 w-3.5" />
                                Swipe
                                <ChevronDown className="h-3.5 w-3.5" />
                            </span>
                        </div>
                    </div>

                    {mobileCommentsOpen && activeItem ? (
                        <div className="absolute inset-0 z-30 md:hidden">
                            <button
                                type="button"
                                aria-label="Close comments"
                                className="absolute inset-0 bg-black/45"
                                onClick={() => setMobileCommentsOpen(false)}
                            />

                            <section className="absolute bottom-0 left-0 right-0 z-40 flex h-[78dvh] flex-col rounded-t-2xl bg-white shadow-2xl">
                                <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-slate-300" />

                                <div className="mt-2 flex items-center justify-between border-b border-slate-200 px-4 py-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-900">Comments</p>
                                        <p className="truncate text-xs text-slate-500">{activeItem.name}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setMobileCommentsOpen(false)}
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="min-h-0 flex-1 overflow-hidden px-4 pb-4 pt-3">
                                    <CommentSection
                                        type={type}
                                        targetId={activeItem.id}
                                        enabled
                                        allowSubmit={allowReactionsAndComments}
                                        listHeightClass="max-h-[44dvh]"
                                    />
                                </div>
                            </section>
                        </div>
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    );
}
