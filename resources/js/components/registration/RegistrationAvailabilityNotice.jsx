import { AlertCircle, CalendarClock, CheckCircle2, Clock3 } from 'lucide-react';

import { yearbookPalette as palette } from '@/lib/theme';

const styleByState = {
    active: {
        icon: CheckCircle2,
        border: 'rgba(5,150,105,0.35)',
        background: 'rgba(16,185,129,0.08)',
        color: '#047857',
    },
    inactive: {
        icon: AlertCircle,
        border: 'rgba(184,56,40,0.35)',
        background: 'rgba(184,56,40,0.08)',
        color: palette.red,
    },
    expired: {
        icon: Clock3,
        border: 'rgba(184,56,40,0.35)',
        background: 'rgba(184,56,40,0.08)',
        color: palette.red,
    },
    not_started: {
        icon: CalendarClock,
        border: 'rgba(180,130,50,0.35)',
        background: 'rgba(232,217,138,0.18)',
        color: '#7c5b14',
    },
};

export default function RegistrationAvailabilityNotice({ status, message }) {
    const style = styleByState[status] ?? styleByState.inactive;
    const Icon = style.icon;

    return (
        <div
            className="flex items-start gap-3 rounded-xl border px-4 py-3 text-sm"
            style={{ borderColor: style.border, background: style.background, color: style.color }}
        >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{message}</p>
        </div>
    );
}
