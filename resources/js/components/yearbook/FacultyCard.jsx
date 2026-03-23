import { Card, CardContent } from '@/components/ui/card';
import { getFacultyPlaceholder, resolveFacultyPhoto } from '@/lib/placeholders';

export default function FacultyCard({ faculty }) {
    const facultySeed = faculty?.id ?? faculty?.name ?? '';

    return (
        <Card>
            <CardContent className="flex items-center gap-4 p-4">
                <img
                    src={resolveFacultyPhoto(faculty?.photo, facultySeed)}
                    alt={faculty.name}
                    className="h-14 w-14 rounded-full object-cover"
                    onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = getFacultyPlaceholder(facultySeed);
                    }}
                />
                <div>
                    <p className="font-medium text-slate-900">{faculty.name}</p>
                    <p className="text-sm text-slate-500">{faculty.role}</p>
                </div>
            </CardContent>
        </Card>
    );
}
