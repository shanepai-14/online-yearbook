import { createContext, useContext, useEffect } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/utils';

const DialogContext = createContext(null);

function Dialog({ open, onOpenChange, children }) {
    return <DialogContext.Provider value={{ open, onOpenChange }}>{children}</DialogContext.Provider>;
}

function useDialogContext() {
    const context = useContext(DialogContext);

    if (!context) {
        throw new Error('Dialog components must be used inside <Dialog>.');
    }

    return context;
}

function DialogContent({ className, children, ...props }) {
    const { open, onOpenChange } = useDialogContext();

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                onOpenChange?.(false);
            }
        };

        window.addEventListener('keydown', handleEscape);

        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener('keydown', handleEscape);
        };
    }, [open, onOpenChange]);

    if (!open) {
        return null;
    }

    return createPortal(
        <div className="fixed inset-0 z-50">
            <button
                type="button"
                aria-label="Close modal"
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={() => onOpenChange?.(false)}
            />
            <div
                role="dialog"
                aria-modal="true"
                className={cn('absolute inset-0', className)}
                {...props}
            >
                {children}
            </div>
        </div>,
        document.body,
    );
}

function DialogClose({ className, ...props }) {
    const { onOpenChange } = useDialogContext();

    return (
        <button
            type="button"
            className={cn('inline-flex items-center justify-center rounded-md', className)}
            onClick={() => onOpenChange?.(false)}
            {...props}
        />
    );
}

export { Dialog, DialogClose, DialogContent };
