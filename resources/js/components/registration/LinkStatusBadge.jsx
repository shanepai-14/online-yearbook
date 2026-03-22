import { Badge } from '@/components/ui/badge';
import { yearbookPalette as palette } from '@/lib/theme';

const statusMap = {
    active: { label: 'Active', variant: 'success' },
    inactive: { label: 'Inactive', variant: 'secondary' },
    not_started: { label: 'Not Started', variant: 'warning' },
    expired: { label: 'Expired', variant: 'outline' },
};

export default function LinkStatusBadge({ status }) {
    const normalizedStatus = typeof status === 'string' ? status : 'inactive';
    const mapped = statusMap[normalizedStatus] ?? statusMap.inactive;

    if (mapped.variant === 'outline') {
        return (
            <Badge
                variant="outline"
                className="border text-xs uppercase tracking-[0.08em]"
                style={{ borderColor: `${palette.red}66`, color: palette.red }}
            >
                {mapped.label}
            </Badge>
        );
    }

    return (
        <Badge variant={mapped.variant} className="text-xs uppercase tracking-[0.08em]">
            {mapped.label}
        </Badge>
    );
}
