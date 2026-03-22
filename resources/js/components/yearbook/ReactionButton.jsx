import { Heart } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function ReactionButton({
    count = 0,
    reacted = false,
    disabled = false,
    onToggle,
    className,
}) {
    return (
        <Button
            type="button"
            size="sm"
            variant={reacted ? 'default' : 'outline'}
            disabled={disabled}
            onClick={onToggle}
            className={cn(
                'h-9 rounded-full border px-3 text-xs tracking-wide',
                reacted ? 'border-rose-600 bg-rose-600 text-white hover:bg-rose-500' : '',
                className,
            )}
        >
            <Heart className={cn('mr-1 h-4 w-4', reacted ? 'fill-current' : '')} />
            {count}
        </Button>
    );
}
