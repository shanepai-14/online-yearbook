import { Card, CardContent } from '@/components/ui/card';

export default function FacultyCard({ faculty }) {
    return (
        <Card>
            <CardContent className="flex items-center gap-4 p-4">
                <img
                    src={faculty.photo || 'https://via.placeholder.com/120'}
                    alt={faculty.name}
                    className="h-14 w-14 rounded-full object-cover"
                />
                <div>
                    <p className="font-medium text-slate-900">{faculty.name}</p>
                    <p className="text-sm text-slate-500">{faculty.role}</p>
                </div>
            </CardContent>
        </Card>
    );
}
