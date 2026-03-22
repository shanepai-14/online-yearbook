import { Download, ImagePlus, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import StudentCard from '@/components/yearbook/StudentCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { yearbookPalette as palette } from '@/lib/theme';

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1350;
const PHOTO_PLACEHOLDER = 'https://via.placeholder.com/900x900?text=Your+Photo';
const DEFAULT_PREVIEW_MAX_WIDTH = 380;
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

const TEMPLATES = {
    classic: {
        id: 'classic',
        name: 'Classic Blue',
        description: 'Navy stage with formal gold accents',
        backgroundTop: '#142760',
        backgroundBottom: '#1a2a6c',
        accent: '#e8d98a',
        pillBackground: 'rgba(232,217,138,0.25)',
    },
    crimson: {
        id: 'crimson',
        name: 'Crimson Gala',
        description: 'Crimson stage with cream accents',
        backgroundTop: '#7f1d1d',
        backgroundBottom: '#b83828',
        accent: '#fef3c7',
        pillBackground: 'rgba(254,243,199,0.28)',
    },
    midnight: {
        id: 'midnight',
        name: 'Midnight Modern',
        description: 'Dark stage with cyan accents',
        backgroundTop: '#0f172a',
        backgroundBottom: '#1e293b',
        accent: '#38bdf8',
        pillBackground: 'rgba(56,189,248,0.24)',
    },
};

const ALIGNMENT_OPTIONS = [
    { value: 'left', label: 'Left' },
    { value: 'center', label: 'Center' },
    { value: 'right', label: 'Right' },
];

function normalizeAlignment(value) {
    if (value === 'center' || value === 'right') {
        return value;
    }

    return 'left';
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function hexToRgba(hex, alpha = 1) {
    if (typeof hex !== 'string') {
        return null;
    }

    const value = hex.trim();

    if (/^#[0-9a-fA-F]{6}$/.test(value)) {
        const red = Number.parseInt(value.slice(1, 3), 16);
        const green = Number.parseInt(value.slice(3, 5), 16);
        const blue = Number.parseInt(value.slice(5, 7), 16);

        return `rgba(${red},${green},${blue},${alpha})`;
    }

    if (/^#[0-9a-fA-F]{3}$/.test(value)) {
        const red = Number.parseInt(`${value[1]}${value[1]}`, 16);
        const green = Number.parseInt(`${value[2]}${value[2]}`, 16);
        const blue = Number.parseInt(`${value[3]}${value[3]}`, 16);

        return `rgba(${red},${green},${blue},${alpha})`;
    }

    return null;
}

function loadImage(src) {
    return new Promise((resolve) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => resolve(image);
        image.onerror = () => resolve(null);
        image.src = src;
    });
}

function drawCoverImage(ctx, image, x, y, width, height) {
    if (!image) {
        ctx.fillStyle = '#d7dbe8';
        ctx.fillRect(x, y, width, height);
        ctx.fillStyle = '#667085';
        ctx.font = "bold 44px 'Helvetica Neue', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText('PHOTO', x + width / 2, y + height / 2);
        return;
    }

    const imageRatio = image.width / image.height;
    const targetRatio = width / height;
    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = image.width;
    let sourceHeight = image.height;

    if (imageRatio > targetRatio) {
        sourceWidth = image.height * targetRatio;
        sourceX = (image.width - sourceWidth) / 2;
    } else {
        sourceHeight = image.width / targetRatio;
        sourceY = (image.height - sourceHeight) / 2;
    }

    ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function createVerticalGradient(ctx, topColor, bottomColor) {
    const gradient = ctx.createLinearGradient(0, 0, 0, CARD_HEIGHT);
    gradient.addColorStop(0, topColor);
    gradient.addColorStop(1, bottomColor);
    return gradient;
}

function wrapTextLines(ctx, text, maxWidth, maxLines = 2) {
    const words = String(text || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (words.length === 0) {
        return [];
    }

    let line = '';
    const lines = [];

    for (let index = 0; index < words.length; index += 1) {
        const testLine = line ? `${line} ${words[index]}` : words[index];
        const measuredWidth = ctx.measureText(testLine).width;

        if (measuredWidth <= maxWidth || line === '') {
            line = testLine;
            continue;
        }

        lines.push(line);
        line = words[index];

        if (lines.length >= maxLines - 1) {
            const remaining = words.slice(index).join(' ');
            let truncated = remaining.length > 64 ? `${remaining.slice(0, 61)}...` : remaining;

            while (ctx.measureText(truncated).width > maxWidth && truncated.length > 1) {
                truncated = `${truncated.slice(0, -4)}...`;
            }

            lines.push(truncated);
            return lines;
        }
    }

    if (line) {
        lines.push(line);
    }

    return lines.slice(0, maxLines);
}

function drawStudentCardCore(ctx, payload, image, template) {
    const cardWidth = 720;
    const cardHeight = 960;
    const cardX = (CARD_WIDTH - cardWidth) / 2;
    const cardY = 210;
    const textAlignment = normalizeAlignment(payload.textAlignment);

    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(cardX + 10, cardY + 12, cardWidth, cardHeight);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cardX, cardY, cardWidth, cardHeight);
    if (payload.showFrame !== false) {
        ctx.strokeStyle = palette.cardBorder;
        ctx.lineWidth = 3;
        ctx.strokeRect(cardX, cardY, cardWidth, cardHeight);
    }

    ctx.fillStyle = '#e8eaf2';
    ctx.fillRect(cardX, cardY, cardWidth, cardHeight);
    drawCoverImage(ctx, image, cardX, cardY, cardWidth, cardHeight);

    const gradient = ctx.createLinearGradient(0, cardY + cardHeight - 320, 0, cardY + cardHeight);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, hexToRgba(template.backgroundBottom, 0.92) || 'rgba(26,42,108,0.92)');
    ctx.fillStyle = gradient;
    ctx.fillRect(cardX, cardY, cardWidth, cardHeight);

    const textPaddingX = 30;
    const textWidth = cardWidth - textPaddingX * 2;
    const textStartY = cardY + cardHeight - 120;
    const textX =
        textAlignment === 'center'
            ? cardX + cardWidth / 2
            : textAlignment === 'right'
              ? cardX + cardWidth - textPaddingX
              : cardX + textPaddingX;

    ctx.textAlign = textAlignment;
    ctx.fillStyle = '#ffffff';
    ctx.font = "600 52px 'Georgia', serif";
    ctx.fillText(payload.name || 'Guest Student', textX, textStartY);

    ctx.fillStyle = 'rgba(232,217,138,0.85)';
    ctx.font = "italic 30px 'Georgia', serif";
    const mottoValue = payload.motto ? `"${payload.motto}"` : '"Dream big. Build boldly."';
    const mottoLines = wrapTextLines(ctx, mottoValue, textWidth, 2);
    let mottoBottom = textStartY + 46;

    mottoLines.forEach((line) => {
        ctx.fillText(line, textX, mottoBottom);
        mottoBottom += 34;
    });

    if (String(payload.badge || '').trim() !== '') {
        const badgeText = String(payload.badge).toUpperCase();
        ctx.font = "700 20px 'Helvetica Neue', sans-serif";
        const badgeWidth = Math.max(180, ctx.measureText(badgeText).width + 36);
        const badgeHeight = 44;
        const badgeX =
            textAlignment === 'center'
                ? cardX + (cardWidth - badgeWidth) / 2
                : textAlignment === 'right'
                  ? cardX + cardWidth - textPaddingX - badgeWidth
                  : cardX + textPaddingX;
        const badgeY = Math.min(cardY + cardHeight - 54, mottoBottom + 10);

        ctx.strokeStyle = 'rgba(232,217,138,0.9)';
        ctx.lineWidth = 2;
        ctx.strokeRect(badgeX, badgeY, badgeWidth, badgeHeight);

        ctx.fillStyle = 'rgba(232,217,138,0.9)';
        ctx.textAlign = 'center';
        ctx.font = "700 18px 'Helvetica Neue', sans-serif";
        ctx.fillText(badgeText, badgeX + badgeWidth / 2, badgeY + 29);
    }
}

async function buildCardBlob({ template, payload }) {
    const canvas = document.createElement('canvas');
    canvas.width = CARD_WIDTH;
    canvas.height = CARD_HEIGHT;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Unable to render card.');
    }

    const showFrame = payload.showFrame !== false;

    ctx.fillStyle = createVerticalGradient(ctx, template.backgroundTop, template.backgroundBottom);
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

    if (showFrame) {
        ctx.strokeStyle = template.accent;
        ctx.lineWidth = 10;
        ctx.strokeRect(34, 34, CARD_WIDTH - 68, CARD_HEIGHT - 68);
    }

    const image = await loadImage(payload.photo || PHOTO_PLACEHOLDER);
    drawStudentCardCore(ctx, payload, image, template);

    if (showFrame) {
        ctx.textAlign = 'left';
        ctx.fillStyle = template.accent;
        ctx.font = "600 30px 'Helvetica Neue', sans-serif";
        ctx.fillText((payload.schoolName || 'School').toUpperCase(), 70, 96);

        ctx.fillStyle = 'rgba(255,255,255,0.86)';
        ctx.font = "500 24px 'Helvetica Neue', sans-serif";
        ctx.fillText(`CLASS OF ${payload.year || new Date().getFullYear()}`, 70, 134);

        ctx.fillStyle = template.pillBackground;
        ctx.fillRect(180, CARD_HEIGHT - 112, CARD_WIDTH - 360, 56);
        ctx.strokeStyle = template.accent;
        ctx.lineWidth = 2;
        ctx.strokeRect(180, CARD_HEIGHT - 112, CARD_WIDTH - 360, 56);

        ctx.textAlign = 'center';
        ctx.fillStyle = template.accent;
        ctx.font = "700 24px 'Helvetica Neue', sans-serif";
        ctx.fillText((payload.department || 'General Program').toUpperCase(), CARD_WIDTH / 2, CARD_HEIGHT - 76);
    }

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error('Unable to generate download file.'));
                    return;
                }

                resolve(blob);
            },
            'image/png',
            1,
        );
    });
}

function TemplateButton({ template, active, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full rounded-xl border p-3 text-left transition ${
                active ? 'border-slate-900 bg-slate-50 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
        >
            <div
                className="mb-2 h-12 w-full rounded-lg"
                style={{ background: `linear-gradient(135deg, ${template.backgroundTop}, ${template.backgroundBottom})` }}
            />
            <p className="text-sm font-semibold text-slate-900">{template.name}</p>
            <p className="text-xs text-slate-500">{template.description}</p>
        </button>
    );
}

function PreviewCard({ template, form }) {
    const showFrame = Boolean(form.showFrame);
    const [previewMaxWidth, setPreviewMaxWidth] = useState(DEFAULT_PREVIEW_MAX_WIDTH);
    const previewStudent = {
        name: form.name || 'Guest Student',
        photo: form.photo || '',
        motto: form.motto || 'Dream big. Build boldly.',
        badge: form.badge || '',
    };

    useEffect(() => {
        const photo = String(form.photo || '').trim();

        if (photo === '') {
            setPreviewMaxWidth(DEFAULT_PREVIEW_MAX_WIDTH);
            return undefined;
        }

        let active = true;
        const image = new Image();

        image.onload = () => {
            if (!active) {
                return;
            }

            const width = Number(image.naturalWidth || image.width || DEFAULT_PREVIEW_MAX_WIDTH);
            const height = Number(image.naturalHeight || image.height || DEFAULT_PREVIEW_MAX_WIDTH);
            const dominantEdge = Math.max(width, height);
            const ratioFactor = clamp(width / Math.max(height, 1), 0.85, 1.25);
            const scaled = Math.round(dominantEdge * 0.24 * ratioFactor);
            const nextWidth = clamp(scaled, 300, 560);

            setPreviewMaxWidth(nextWidth);
        };

        image.onerror = () => {
            if (active) {
                setPreviewMaxWidth(DEFAULT_PREVIEW_MAX_WIDTH);
            }
        };

        image.src = photo;

        return () => {
            active = false;
        };
    }, [form.photo]);

    return (
        <div
            className="relative mx-auto w-full overflow-hidden border p-0 shadow-xl"
            style={{
                maxWidth: `${previewMaxWidth}px`,
                borderColor: showFrame ? template.accent : 'transparent',
                background: `linear-gradient(180deg, ${template.backgroundTop}, ${template.backgroundBottom})`,
            }}
        >
            {showFrame ? (
                <div
                    className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.14em]"
                    style={{ color: template.accent }}
                >
                    <span>{form.schoolName || 'School'}</span>
                    <span>Class of {form.year}</span>
                </div>
            ) : null}

            <StudentCard
                student={previewStudent}
                alignment={normalizeAlignment(form.textAlignment)}
                gradientColor={template.backgroundBottom}
                showFrame={showFrame}
                className="mx-auto w-full max-w-full"
            />

            {showFrame ? (
                <div
                    className="mt-3 rounded-md px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.1em]"
                    style={{
                        color: template.accent,
                        border: `1px solid ${template.accent}`,
                        background: template.pillBackground,
                    }}
                >
                    {form.department || 'General Program'}
                </div>
            ) : null}
        </div>
    );
}

export default function GuestCardMakerPage() {
    const [templateId, setTemplateId] = useState('classic');
    const [downloading, setDownloading] = useState(false);
    const [notice, setNotice] = useState('');
    const [form, setForm] = useState({
        schoolName: 'Davao Vision Colleges',
        name: 'Guest Student',
        department: 'General Program',
        year: String(new Date().getFullYear()),
        textAlignment: 'left',
        showFrame: false,
        motto: 'Dream big. Build boldly.',
        badge: 'Honor Student',
        photo: '',
    });

    const selectedTemplate = TEMPLATES[templateId] ?? TEMPLATES.classic;
    const designOptions = useMemo(() => Object.values(TEMPLATES), []);

    useEffect(() => {
        return () => {
            if (form.photo?.startsWith('blob:')) {
                URL.revokeObjectURL(form.photo);
            }
        };
    }, [form.photo]);

    const updateField = (field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const handlePhotoUpload = (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        if (form.photo?.startsWith('blob:')) {
            URL.revokeObjectURL(form.photo);
        }

        updateField('photo', URL.createObjectURL(file));
    };

    const handleDownload = async () => {
        setNotice('');
        setDownloading(true);

        try {
            const blob = await buildCardBlob({
                template: selectedTemplate,
                payload: form,
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const safeName = (form.name || 'guest-student').toLowerCase().replace(/[^a-z0-9]+/g, '-');

            link.href = url;
            link.download = `${safeName || 'guest-student'}-${form.year}-card.png`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        } catch (error) {
            setNotice(error?.message || 'Unable to generate card download.');
        } finally {
            setDownloading(false);
        }
    };

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
                    <span className="text-xs uppercase tracking-[0.2em]" style={{ ...sansStyle, color: palette.gold }}>
                        Davao Vision Colleges · Fun Card Maker
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        to="/"
                        className="border px-3 py-1 text-xs uppercase tracking-[0.15em] transition-colors"
                        style={{
                            ...sansStyle,
                            borderColor: 'rgba(232,217,138,0.35)',
                            color: 'rgba(232,217,138,0.92)',
                            background: 'rgba(255,255,255,0.05)',
                        }}
                    >
                        Home
                    </Link>
                    <Link
                        to="/login"
                        className="border px-3 py-1 text-xs uppercase tracking-[0.15em] transition-colors"
                        style={{
                            ...sansStyle,
                            borderColor: 'rgba(232,217,138,0.35)',
                            color: 'rgba(232,217,138,0.92)',
                            background: 'rgba(255,255,255,0.05)',
                        }}
                    >
                        Login
                    </Link>
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
                <div className="mb-3 text-xs uppercase tracking-[0.2em]" style={{ ...sansStyle, color: palette.goldDark }}>
                    Guest Playground
                </div>
                <h1 className="mb-2 text-5xl font-normal tracking-wide text-white" style={{ letterSpacing: '2px' }}>
                    Fun <span style={{ color: palette.gold }}>Graduation Card Maker</span>
                </h1>
                <div className="my-4 h-0.5 w-12" style={{ background: palette.red }} />
                <p className="max-w-lg text-sm leading-relaxed" style={{ ...sansStyle, color: 'rgba(255,255,255,0.55)' }}>
                    Create a shareable graduation card for fun. Choose a design, customize details, and download as PNG.
                </p>
            </section>

            <section className="px-6 pb-2 pt-10 sm:px-10">
                <div className="mb-1 flex items-center gap-3">
                    <span className="text-xs uppercase tracking-[0.2em]" style={{ ...sansStyle, color: palette.muted, fontSize: '10px' }}>
                        Card Builder
                    </span>
                    <div className="h-px flex-1" style={{ background: palette.cardBorder }} />
                </div>
                <p className="text-xs" style={{ ...sansStyle, color: '#9ca3af' }}>
                    Edit details on the left and preview the output card on the right.
                </p>
            </section>

            <section className="px-6 py-6 sm:px-10">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
                    <article className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6" style={{ borderColor: palette.cardBorder }}>
                        <div className="mb-4 flex items-center gap-2">
                            <Sparkles className="h-4 w-4" style={{ color: palette.red }} />
                            <h2 className="text-lg font-semibold text-slate-900">Card Details</h2>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="guest_school_name">School Name</Label>
                                <Input
                                    id="guest_school_name"
                                    value={form.schoolName}
                                    onChange={(event) => updateField('schoolName', event.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="guest_year">Graduation Year</Label>
                                <Input
                                    id="guest_year"
                                    value={form.year}
                                    onChange={(event) => updateField('year', event.target.value)}
                                    placeholder="2026"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="guest_name">Name</Label>
                                <Input
                                    id="guest_name"
                                    value={form.name}
                                    onChange={(event) => updateField('name', event.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="guest_department">Department / Program</Label>
                                <Input
                                    id="guest_department"
                                    value={form.department}
                                    onChange={(event) => updateField('department', event.target.value)}
                                />
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="guest_motto">Motto</Label>
                                <Input
                                    id="guest_motto"
                                    value={form.motto}
                                    onChange={(event) => updateField('motto', event.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="guest_badge">Badge (optional)</Label>
                                <Input
                                    id="guest_badge"
                                    value={form.badge}
                                    onChange={(event) => updateField('badge', event.target.value)}
                                    placeholder="Honor Student"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="guest_photo">Upload Photo</Label>
                                <Input
                                    id="guest_photo"
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoUpload}
                                    className="cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="guest_text_alignment">Text Alignment</Label>
                                <select
                                    id="guest_text_alignment"
                                    value={normalizeAlignment(form.textAlignment)}
                                    onChange={(event) => updateField('textAlignment', event.target.value)}
                                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                                >
                                    {ALIGNMENT_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="guest_show_frame">Card Frame</Label>
                                <select
                                    id="guest_show_frame"
                                    value={form.showFrame ? 'on' : 'off'}
                                    onChange={(event) => updateField('showFrame', event.target.value === 'on')}
                                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                                >
                                    <option value="on">With Frame</option>
                                    <option value="off">No Frame</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-6 space-y-3">
                            <p className="text-xs uppercase tracking-[0.14em]" style={{ ...sansStyle, color: palette.muted }}>
                                Choose Design
                            </p>
                            <div className="grid gap-3 sm:grid-cols-3">
                                {designOptions.map((template) => (
                                    <TemplateButton
                                        key={template.id}
                                        template={template}
                                        active={template.id === templateId}
                                        onClick={() => setTemplateId(template.id)}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap items-center gap-3">
                            <Button type="button" onClick={handleDownload} disabled={downloading}>
                                <Download className="mr-2 h-4 w-4" />
                                {downloading ? 'Preparing...' : 'Download Card'}
                            </Button>
                            {notice ? <p className="text-sm text-red-600">{notice}</p> : null}
                        </div>
                    </article>

                    <article className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6" style={{ borderColor: palette.cardBorder }}>
                        <div className="mb-4 flex items-center gap-2">
                            <ImagePlus className="h-4 w-4" style={{ color: palette.navy }} />
                            <h2 className="text-lg font-semibold text-slate-900">Live Preview</h2>
                        </div>
                        <PreviewCard template={selectedTemplate} form={form} />
                        <p className="mt-4 text-xs text-slate-500">For fun use only. This does not create an official yearbook record.</p>
                    </article>
                </div>
            </section>

            <footer
                className="mt-8 flex items-center justify-between border-t-2 px-6 py-7 sm:px-10"
                style={{ background: palette.navy, borderColor: palette.goldDark }}
            >
                <div className="text-xs uppercase tracking-[0.2em]" style={{ ...sansStyle, color: palette.gold }}>
                    Davao Vision Colleges
                </div>
                <div className="text-xs" style={{ ...sansStyle, color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>
                    FUN CARD MAKER · FOR CREATIVE USE
                </div>
            </footer>
        </div>
    );
}
