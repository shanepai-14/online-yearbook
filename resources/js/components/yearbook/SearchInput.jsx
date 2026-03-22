import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';

export default function SearchInput({ value, onChange }) {
    return (
        <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder="Search by student name or department label"
                className="pl-9"
            />
        </div>
    );
}
