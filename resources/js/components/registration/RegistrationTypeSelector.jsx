import { Label } from '@/components/ui/label';
import { registrationTypeMeta } from '@/lib/registrationLinkTypes';

const typeDescriptions = {
    free_year_free_department: 'User selects both department and year.',
    fixed_year_select_department: 'Year is fixed by link, user selects department.',
    fixed_department_select_year: 'Department is fixed by link, user selects year.',
    fixed_year_fixed_department: 'Both year and department are fixed by link.',
};

export default function RegistrationTypeSelector({ value, onChange, options = [] }) {
    const meta = registrationTypeMeta(value);

    return (
        <div className="space-y-2">
            <Label htmlFor="registration_link_type">Registration Type</Label>
            <select
                id="registration_link_type"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[#1a2a6c] focus:ring-2 focus:ring-[#1a2a6c]/30"
                required
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <p className="text-xs text-slate-500">{typeDescriptions[meta.value] ?? 'Configure allowed registration inputs.'}</p>
        </div>
    );
}
