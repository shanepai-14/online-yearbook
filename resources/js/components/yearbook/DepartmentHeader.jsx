export default function DepartmentHeader({ department }) {
    if (!department) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h2 className="text-lg font-semibold text-slate-900">All Programs</h2>
                <p className="mt-1 text-sm text-slate-600">Browse graduates and faculty across all departments.</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{department.label}</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">{department.full_name}</h2>
            <p className="mt-2 text-sm text-slate-600">{department.description}</p>
        </div>
    );
}
