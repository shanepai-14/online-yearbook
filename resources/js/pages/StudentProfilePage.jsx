import axios from 'axios';
import { ArrowLeft, ArrowRight, Loader2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const initialFormState = {
    name: '',
    photo: '',
    motto: '',
    badge: '',
    class_motto: '',
    department_label: '',
    department_full_name: '',
    graduating_year: '',
};

function completionPercent(form, hasPendingPhotoUpload = false) {
    const fields = ['name', 'photo', 'motto', 'badge', 'department_label', 'graduating_year'];
    const completed = fields.filter((field) => {
        if (field === 'photo') {
            return hasPendingPhotoUpload || String(form.photo || '').trim() !== '';
        }

        return String(form[field] || '').trim() !== '';
    }).length;

    return Math.round((completed / fields.length) * 100);
}

function normalizeGroupPhotoItems(department) {
    if (!department) {
        return [];
    }

    if (Array.isArray(department.group_photo_items) && department.group_photo_items.length > 0) {
        return department.group_photo_items
            .filter((item) => item && String(item.photo || '').trim() !== '')
            .map((item, index) => ({
                id: item.id ?? null,
                photo: item.photo,
                sort_order: item.sort_order ?? index + 1,
            }));
    }

    const fallbackPhotos = Array.isArray(department.group_photos)
        ? department.group_photos
        : department.group_photo
            ? [department.group_photo]
            : [];

    return fallbackPhotos
        .filter((photo) => String(photo || '').trim() !== '')
        .map((photo, index) => ({
            id: null,
            photo,
            sort_order: index + 1,
        }));
}

export default function StudentProfilePage() {
    const [form, setForm] = useState(initialFormState);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState('');

    const [groupPhotoItems, setGroupPhotoItems] = useState([]);
    const [groupPhotoBusy, setGroupPhotoBusy] = useState(false);
    const [groupPhotoMessage, setGroupPhotoMessage] = useState('');
    const [groupPhotoError, setGroupPhotoError] = useState('');

    useEffect(() => {
        return () => {
            if (photoPreview.startsWith('blob:')) {
                URL.revokeObjectURL(photoPreview);
            }
        };
    }, [photoPreview]);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await axios.get('/api/student/profile');
                const profile = response.data.profile;

                setForm({
                    name: profile?.name || '',
                    photo: profile?.photo || '',
                    motto: profile?.motto || '',
                    badge: profile?.badge || '',
                    class_motto: profile?.class_motto || '',
                    department_label: profile?.department?.label || '',
                    department_full_name: profile?.department?.full_name || '',
                    graduating_year: profile?.graduating_year ? String(profile.graduating_year) : '',
                });
                setGroupPhotoItems(normalizeGroupPhotoItems(profile?.department));
                setPhotoFile(null);
                setPhotoPreview('');
            } catch (requestError) {
                setError(requestError.response?.data?.message || 'Unable to load student profile.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

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

    const applyDepartmentGroupPhotoUpdate = (departmentPayload) => {
        setGroupPhotoItems(normalizeGroupPhotoItems(departmentPayload));
    };

    const handleGroupPhotoUpload = async (event) => {
        const files = Array.from(event.target.files || []);
        event.target.value = '';

        if (files.length === 0 || groupPhotoBusy) {
            return;
        }

        setGroupPhotoBusy(true);
        setGroupPhotoError('');
        setGroupPhotoMessage('');

        try {
            const payload = new FormData();

            files.forEach((file) => {
                payload.append('department_group_photo_uploads[]', file);
            });

            const response = await axios.post('/api/student/profile/department-group-photos', payload, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            applyDepartmentGroupPhotoUpdate(response.data.department);
            setGroupPhotoMessage(response.data.message || 'Department group photo updated successfully.');
        } catch (requestError) {
            setGroupPhotoError(requestError.response?.data?.message || 'Unable to upload department group photos.');
        } finally {
            setGroupPhotoBusy(false);
        }
    };

    const handleReorderPhoto = async (index, direction) => {
        if (groupPhotoBusy) {
            return;
        }

        const targetIndex = index + direction;

        if (targetIndex < 0 || targetIndex >= groupPhotoItems.length) {
            return;
        }

        const currentItems = [...groupPhotoItems];
        const nextItems = [...groupPhotoItems];
        const movedItem = nextItems[index];
        nextItems[index] = nextItems[targetIndex];
        nextItems[targetIndex] = movedItem;

        const nextIds = nextItems.map((item) => item.id);

        if (nextIds.some((id) => !id)) {
            return;
        }

        setGroupPhotoItems(nextItems);
        setGroupPhotoBusy(true);
        setGroupPhotoError('');
        setGroupPhotoMessage('');

        try {
            const response = await axios.patch('/api/student/profile/department-group-photos/reorder', {
                photo_ids: nextIds,
            });

            applyDepartmentGroupPhotoUpdate(response.data.department);
            setGroupPhotoMessage(response.data.message || 'Department group photo sequence updated.');
        } catch (requestError) {
            setGroupPhotoItems(currentItems);
            setGroupPhotoError(requestError.response?.data?.message || 'Unable to reorder photos.');
        } finally {
            setGroupPhotoBusy(false);
        }
    };

    const handleRemovePhoto = async (photoItem) => {
        if (!photoItem?.id || groupPhotoBusy) {
            return;
        }

        setGroupPhotoBusy(true);
        setGroupPhotoError('');
        setGroupPhotoMessage('');

        try {
            const response = await axios.delete(
                `/api/student/profile/department-group-photos/${photoItem.id}`,
            );

            applyDepartmentGroupPhotoUpdate(response.data.department);
            setGroupPhotoMessage(response.data.message || 'Department group photo removed.');
        } catch (requestError) {
            setGroupPhotoError(requestError.response?.data?.message || 'Unable to remove photo.');
        } finally {
            setGroupPhotoBusy(false);
        }
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
            payload.append('class_motto', form.class_motto || '');

            if (photoFile) {
                payload.append('photo_upload', photoFile);
            } else {
                payload.append('photo', form.photo || '');
            }

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

            setForm({
                name: profile?.name || '',
                photo: profile?.photo || '',
                motto: profile?.motto || '',
                badge: profile?.badge || '',
                class_motto: profile?.class_motto || '',
                department_label: profile?.department?.label || '',
                department_full_name: profile?.department?.full_name || '',
                graduating_year: profile?.graduating_year ? String(profile.graduating_year) : '',
            });
            setGroupPhotoItems(normalizeGroupPhotoItems(profile?.department));
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
                                    Upload JPG/PNG/WebP up to 15MB. This will be used on the public yearbook card.
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

                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="class_motto">Class Motto</Label>
                        <Textarea
                            id="class_motto"
                            value={form.class_motto}
                            onChange={handleInputChange('class_motto')}
                            rows={3}
                            placeholder="Write the official class motto shown on the yearbook pages."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Graduating Year</Label>
                        <div className="flex h-10 w-full items-center rounded-md border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-700">
                            {form.graduating_year || '-'}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Department</Label>
                        <div className="flex h-10 w-full items-center rounded-md border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-700">
                            {form.department_label || '-'}
                        </div>
                        {form.department_full_name ? (
                            <p className="text-xs text-slate-500">{form.department_full_name}</p>
                        ) : null}
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="department_group_photo_upload">Department Group Photo</Label>
                        <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                            {groupPhotoItems.length > 0 ? (
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {groupPhotoItems.map((photoItem, index) => (
                                        <div key={`${photoItem.id || photoItem.photo}-${index}`} className="space-y-2">
                                            <div className="relative overflow-hidden rounded-lg ring-1 ring-slate-200">
                                                <img
                                                    src={photoItem.photo}
                                                    alt={`Department group photo ${index + 1}`}
                                                    className="h-36 w-full object-cover sm:h-40"
                                                    onError={(event) => {
                                                        event.currentTarget.onerror = null;
                                                        event.currentTarget.src = 'https://via.placeholder.com/640x360?text=Department+Group+Photo';
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemovePhoto(photoItem)}
                                                    disabled={groupPhotoBusy || !photoItem.id}
                                                    className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black disabled:opacity-50"
                                                    aria-label={`Remove group photo ${index + 1}`}
                                                    title="Remove photo"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-xs text-slate-500">#{index + 1}</span>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleReorderPhoto(index, -1)}
                                                        disabled={groupPhotoBusy || index === 0 || !photoItem.id}
                                                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 disabled:opacity-50"
                                                        aria-label={`Move photo ${index + 1} left`}
                                                        title="Move earlier"
                                                    >
                                                        <ArrowLeft className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleReorderPhoto(index, 1)}
                                                        disabled={groupPhotoBusy || index === groupPhotoItems.length - 1 || !photoItem.id}
                                                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 disabled:opacity-50"
                                                        aria-label={`Move photo ${index + 1} right`}
                                                        title="Move later"
                                                    >
                                                        <ArrowRight className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
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
                                    onChange={handleGroupPhotoUpload}
                                    disabled={groupPhotoBusy}
                                    className="cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white disabled:cursor-not-allowed"
                                />
                                <p className="text-xs text-slate-500">
                                    New uploads are appended automatically. Reorder with arrows. Remove only using the X button on each image.
                                </p>
                                {groupPhotoBusy ? (
                                    <p className="inline-flex items-center gap-2 text-xs text-slate-600">
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        Updating department photos...
                                    </p>
                                ) : null}
                                {groupPhotoError ? <p className="text-xs text-red-600">{groupPhotoError}</p> : null}
                                {groupPhotoMessage ? <p className="text-xs text-emerald-600">{groupPhotoMessage}</p> : null}
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
