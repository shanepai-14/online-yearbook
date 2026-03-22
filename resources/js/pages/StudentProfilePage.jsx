import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const initialFormState = {
    name: '',
    photo: '',
    motto: '',
    badge: '',
    department_id: '',
    graduating_year: '',
};

function completionPercent(form, hasPendingPhotoUpload = false) {
    const fields = ['name', 'photo', 'motto', 'badge', 'department_id', 'graduating_year'];
    const completed = fields.filter((field) => {
        if (field === 'photo') {
            return hasPendingPhotoUpload || String(form.photo || '').trim() !== '';
        }

        return String(form[field] || '').trim() !== '';
    }).length;

    return Math.round((completed / fields.length) * 100);
}

export default function StudentProfilePage() {
    const [form, setForm] = useState(initialFormState);
    const [years, setYears] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState('');
    const [departmentGroupPhotoFiles, setDepartmentGroupPhotoFiles] = useState([]);
    const [departmentGroupPhotoPreviews, setDepartmentGroupPhotoPreviews] = useState([]);

    useEffect(() => {
        return () => {
            if (photoPreview.startsWith('blob:')) {
                URL.revokeObjectURL(photoPreview);
            }

            departmentGroupPhotoPreviews.forEach((preview) => {
                if (typeof preview === 'string' && preview.startsWith('blob:')) {
                    URL.revokeObjectURL(preview);
                }
            });
        };
    }, [photoPreview, departmentGroupPhotoPreviews]);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await axios.get('/api/student/profile');
                const profile = response.data.profile;
                const options = response.data.options;

                setYears(options?.years || []);
                setDepartments(options?.departments || []);
                setForm({
                    name: profile?.name || '',
                    photo: profile?.photo || '',
                    motto: profile?.motto || '',
                    badge: profile?.badge || '',
                    department_id: profile?.department_id ? String(profile.department_id) : '',
                    graduating_year: profile?.graduating_year ? String(profile.graduating_year) : '',
                });
                setPhotoFile(null);
                setPhotoPreview('');
                setDepartmentGroupPhotoFiles([]);
                setDepartmentGroupPhotoPreviews([]);
            } catch (requestError) {
                setError(requestError.response?.data?.message || 'Unable to load student profile.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const availableDepartments = useMemo(() => {
        return departments.filter(
            (department) => String(department.graduating_year) === String(form.graduating_year),
        );
    }, [departments, form.graduating_year]);

    const selectedDepartment = useMemo(() => {
        return departments.find((department) => String(department.id) === String(form.department_id)) || null;
    }, [departments, form.department_id]);

    useEffect(() => {
        if (availableDepartments.length === 0) {
            return;
        }

        const found = availableDepartments.some(
            (department) => String(department.id) === String(form.department_id),
        );

        if (!found) {
            setForm((current) => ({
                ...current,
                department_id: String(availableDepartments[0].id),
            }));
        }
    }, [availableDepartments, form.department_id]);

    const handleInputChange = (field) => (event) => {
        setForm((current) => ({
            ...current,
            [field]: event.target.value,
        }));
    };

    const handlePhotoFileChange = (event) => {
        const file = event.target.files?.[0] || null;

        setPhotoFile(file);

        setPhotoPreview((currentPreview) => {
            if (currentPreview.startsWith('blob:')) {
                URL.revokeObjectURL(currentPreview);
            }

            if (!file) {
                return '';
            }

            return URL.createObjectURL(file);
        });
    };

    const handleDepartmentGroupPhotoFileChange = (event) => {
        const files = Array.from(event.target.files || []);

        setDepartmentGroupPhotoFiles(files);

        setDepartmentGroupPhotoPreviews((currentPreviews) => {
            currentPreviews.forEach((preview) => {
                if (typeof preview === 'string' && preview.startsWith('blob:')) {
                    URL.revokeObjectURL(preview);
                }
            });

            return files.map((file) => URL.createObjectURL(file));
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');
        setSaving(true);

        try {
            const payload = new FormData();
            payload.append('name', form.name);
            payload.append('motto', form.motto);
            payload.append('badge', form.badge);
            payload.append('department_id', String(Number(form.department_id)));
            payload.append('graduating_year', String(Number(form.graduating_year)));

            if (photoFile) {
                payload.append('photo_upload', photoFile);
            } else {
                payload.append('photo', form.photo || '');
            }

            departmentGroupPhotoFiles.forEach((file) => {
                payload.append('department_group_photo_uploads[]', file);
            });

            const response = await axios.post('/api/student/profile', payload, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            const profile = response.data.profile;

            setPhotoPreview((currentPreview) => {
                if (currentPreview.startsWith('blob:')) {
                    URL.revokeObjectURL(currentPreview);
                }

                return '';
            });
            setPhotoFile(null);
            setDepartmentGroupPhotoFiles([]);
            setDepartmentGroupPhotoPreviews((currentPreviews) => {
                currentPreviews.forEach((preview) => {
                    if (typeof preview === 'string' && preview.startsWith('blob:')) {
                        URL.revokeObjectURL(preview);
                    }
                });

                return [];
            });

            setForm((current) => ({
                ...current,
                name: profile.name || '',
                photo: profile.photo || '',
                motto: profile.motto || '',
                badge: profile.badge || '',
                department_id: profile.department_id ? String(profile.department_id) : '',
                graduating_year: profile.graduating_year ? String(profile.graduating_year) : '',
            }));
            setDepartments((currentDepartments) => currentDepartments.map((department) => {
                if (String(department.id) !== String(profile.department_id)) {
                    return department;
                }

                const nextGroupPhotos = Array.isArray(profile.department?.group_photos)
                    ? profile.department.group_photos
                    : [];

                return {
                    ...department,
                    group_photos: nextGroupPhotos,
                    group_photo: nextGroupPhotos[0] || profile.department?.group_photo || department.group_photo || '',
                };
            }));
            setSuccess('Profile updated successfully.');
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to save profile.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <p className="text-sm text-slate-500">Loading profile form...</p>;
    }

    const completion = completionPercent(form, Boolean(photoFile));
    const photoDisplay = photoPreview || form.photo || 'https://via.placeholder.com/320x320?text=Student';
    const existingDepartmentGroupPhotos = Array.isArray(selectedDepartment?.group_photos)
        ? selectedDepartment.group_photos
        : selectedDepartment?.group_photo
            ? [selectedDepartment.group_photo]
            : [];
    const departmentGroupPhotoDisplayList =
        departmentGroupPhotoPreviews.length > 0
            ? departmentGroupPhotoPreviews
            : existingDepartmentGroupPhotos;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Student Profile</CardTitle>
                <CardDescription>Update only the fields needed for the current yearbook design.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-6 flex items-center gap-3">
                    <Badge variant={completion === 100 ? 'success' : 'warning'}>{completion}% Complete</Badge>
                    <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full bg-slate-900" style={{ width: `${completion}%` }} />
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" value={form.name} onChange={handleInputChange('name')} required />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="photo_upload">Profile Photo</Label>
                        <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center">
                            <img
                                src={photoDisplay}
                                alt="Profile preview"
                                className="h-20 w-20 rounded-lg object-cover ring-1 ring-slate-200"
                            />
                            <div className="min-w-0 flex-1 space-y-2">
                                <Input
                                    id="photo_upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoFileChange}
                                    className="cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
                                />
                                <p className="text-xs text-slate-500">
                                    Upload JPG/PNG/WebP up to 3MB. This will be used on the public yearbook card.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="motto">Motto</Label>
                        <Input id="motto" value={form.motto} onChange={handleInputChange('motto')} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="badge">Badge</Label>
                        <Input id="badge" value={form.badge} onChange={handleInputChange('badge')} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="graduating_year">Graduating Year</Label>
                        <select
                            id="graduating_year"
                            value={form.graduating_year}
                            onChange={handleInputChange('graduating_year')}
                            className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                            required
                        >
                            <option value="">Select year</option>
                            {years.map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="department_id">Department</Label>
                        <select
                            id="department_id"
                            value={form.department_id}
                            onChange={handleInputChange('department_id')}
                            className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                            required
                        >
                            <option value="">Select department</option>
                            {availableDepartments.map((department) => (
                                <option key={department.id} value={department.id}>
                                    {department.label} - {department.full_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="department_group_photo_upload">Department Group Photo</Label>
                        <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                            {departmentGroupPhotoDisplayList.length > 0 ? (
                                <div className="flex gap-2 overflow-x-auto pb-1">
                                    {departmentGroupPhotoDisplayList.map((photo, index) => (
                                        <img
                                            key={`${photo}-${index}`}
                                            src={photo}
                                            alt={`Department group preview ${index + 1}`}
                                            className="h-36 w-52 shrink-0 rounded-lg object-cover ring-1 ring-slate-200 sm:h-44 sm:w-64"
                                            onError={(event) => {
                                                event.currentTarget.onerror = null;
                                                event.currentTarget.src = 'https://via.placeholder.com/640x360?text=Department+Group+Photo';
                                            }}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex h-36 items-center justify-center rounded-lg bg-white text-xs text-slate-500 ring-1 ring-slate-200 sm:h-44">
                                    No department group photo uploaded yet.
                                </div>
                            )}
                            <div className="min-w-0 flex-1 space-y-2">
                                <Input
                                    id="department_group_photo_upload"
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleDepartmentGroupPhotoFileChange}
                                    className="cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
                                />
                                <p className="text-xs text-slate-500">
                                    Upload one or more JPG/PNG/WebP files (up to 4MB each) for your selected department.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="sm:col-span-2">
                        {error ? <p className="mb-2 text-sm text-red-600">{error}</p> : null}
                        {success ? <p className="mb-2 text-sm text-emerald-600">{success}</p> : null}

                        <Button type="submit" disabled={saving}>
                            {saving ? 'Saving...' : 'Save Profile'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
