import { LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function PortalTopbar({ title, subtitle, userName, onLogout }) {
    return (
        <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
                <div>
                    <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
                    <p className="text-sm text-slate-500">
                        {subtitle}
                        {userName ? ` • ${userName}` : ''}
                    </p>
                </div>

                <Button type="button" variant="outline" onClick={onLogout} className="gap-2">
                    <LogOut className="h-4 w-4" />
                    Logout
                </Button>
            </div>
        </header>
    );
}
