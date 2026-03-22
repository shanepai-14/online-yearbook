import { NavLink } from 'react-router-dom';

import { cn } from '@/lib/utils';

export default function SidebarNav({ links, orientation = 'vertical', className }) {
    const isHorizontal = orientation === 'horizontal';

    return (
        <nav
            className={cn(
                'rounded-xl border border-slate-200 bg-white p-2',
                isHorizontal ? 'flex flex-nowrap gap-2 overflow-x-auto' : 'space-y-1',
                className,
            )}
        >
            {links.map((link) => (
                <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) =>
                        cn(
                            isHorizontal
                                ? 'inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium transition whitespace-nowrap'
                                : 'block rounded-lg px-3 py-2 text-sm font-medium transition',
                            isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                        )
                    }
                >
                    {link.label}
                </NavLink>
            ))}
        </nav>
    );
}
