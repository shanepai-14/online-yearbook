import { Card, CardContent } from '@/components/ui/card';

const statLabels = {
    graduates_count: 'Graduates',
    programs_count: 'Programs',
    faculty_count: 'Faculty',
    years_count: 'Yearbooks',
};

export default function HeroSection({ title, description, academicYearText, stats }) {
    return (
        <section className="space-y-5">
            <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-900 px-6 py-8 text-white">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">{academicYearText}</p>
                <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">{title}</h1>
                <p className="mt-3 max-w-3xl text-sm text-slate-200 sm:text-base">{description}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {Object.entries(stats).map(([key, value]) => (
                    <Card key={key} className="border-slate-200">
                        <CardContent className="p-4">
                            <p className="text-xs uppercase tracking-wide text-slate-500">{statLabels[key]}</p>
                            <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>
    );
}
