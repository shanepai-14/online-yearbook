import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';

export default function UnauthorizedPage() {
    return (
        <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 text-center">
            <h1 className="text-2xl font-semibold text-slate-900">Unauthorized</h1>
            <p className="mt-2 text-sm text-slate-600">You do not have permission to access this page.</p>
            <Button asChild className="mt-6">
                <Link to="/yearbook">Back to Home</Link>
            </Button>
        </div>
    );
}
