import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { availableYears } from '@/data/yearbooks';

export default function HomePage() {
    return (
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <section className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-900 px-6 py-10 text-white">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Online Yearbook</p>
                <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Celebrate Every Graduate Story</h1>
                <p className="mt-4 max-w-2xl text-sm text-slate-200 sm:text-base">
                    Explore graduates by year, browse departments, and view highlights in one yearbook experience.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                    <Button asChild>
                        <Link to="/graduates/2025">View Class of 2025</Link>
                    </Button>
                    <Button asChild variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20">
                        <Link to="/login">Login</Link>
                    </Button>
                </div>
            </section>

            <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {availableYears.map((year) => (
                    <Card key={year}>
                        <CardHeader>
                            <CardTitle>Graduates {year}</CardTitle>
                            <CardDescription>Public yearbook view</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild variant="secondary" className="w-full">
                                <Link to={`/graduates/${year}`}>Open Yearbook</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </section>
        </div>
    );
}
