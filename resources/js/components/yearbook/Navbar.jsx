import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';

export default function Navbar({ schoolName, year }) {
    return (
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
                <Link to="/" className="text-sm font-semibold text-slate-900 sm:text-base">
                    {schoolName}
                </Link>

                <div className="flex items-center gap-2">
                    <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 sm:inline-flex">
                        Class of {year}
                    </span>
                    <Button asChild size="sm" variant="outline">
                        <Link to="/login">Login</Link>
                    </Button>
                </div>
            </div>
        </header>
    );
}
