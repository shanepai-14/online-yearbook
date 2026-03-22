import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function DepartmentTabs({ departments, value, onChange }) {
    return (
        <Tabs value={String(value)} onValueChange={(nextValue) => onChange(nextValue === 'all' ? 'all' : Number(nextValue))}>
            <TabsList className="h-auto w-full flex-wrap justify-start gap-1 p-1">
                <TabsTrigger value="all">All Programs</TabsTrigger>
                {departments.map((department) => (
                    <TabsTrigger key={department.id} value={String(department.id)}>
                        {department.label}
                    </TabsTrigger>
                ))}
            </TabsList>
        </Tabs>
    );
}
