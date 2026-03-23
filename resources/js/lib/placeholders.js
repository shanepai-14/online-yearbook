export const STUDENT_MALE_PLACEHOLDER = '/placeholder/graduate_male_placeholder.png';
export const STUDENT_FEMALE_PLACEHOLDER = '/placeholder/graduate_female_placeholder.png';
export const FACULTY_MALE_PLACEHOLDER = '/placeholder/faculty_male_placeholder.png';
export const FACULTY_FEMALE_PLACEHOLDER = '/placeholder/faculty_female_placeholder.png';

export const STUDENT_GENDER_OPTIONS = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
];

export function normalizeGender(value) {
    if (typeof value !== 'string') {
        return null;
    }

    const normalized = value.trim().toLowerCase();

    if (['male', 'm', 'man', 'boy'].includes(normalized)) {
        return 'male';
    }

    if (['female', 'f', 'woman', 'girl'].includes(normalized)) {
        return 'female';
    }

    return null;
}

function seedHash(input) {
    const source = String(input ?? '');
    let hash = 0;

    for (let index = 0; index < source.length; index += 1) {
        hash = (hash << 5) - hash + source.charCodeAt(index);
        hash |= 0;
    }

    return Math.abs(hash);
}

export function getStudentPlaceholder(gender) {
    const normalizedGender = normalizeGender(gender);

    return normalizedGender === 'female' ? STUDENT_FEMALE_PLACEHOLDER : STUDENT_MALE_PLACEHOLDER;
}

export function getFacultyPlaceholder(seed = '') {
    const normalizedSeed = String(seed ?? '').trim();

    if (normalizedSeed === '') {
        return Math.random() < 0.5 ? FACULTY_MALE_PLACEHOLDER : FACULTY_FEMALE_PLACEHOLDER;
    }

    return seedHash(normalizedSeed) % 2 === 0 ? FACULTY_MALE_PLACEHOLDER : FACULTY_FEMALE_PLACEHOLDER;
}

export function resolveStudentPhoto(photo, gender) {
    if (typeof photo === 'string') {
        const trimmed = photo.trim();

        if (trimmed !== '') {
            return trimmed;
        }
    }

    return getStudentPlaceholder(gender);
}

export function resolveFacultyPhoto(photo, seed = '') {
    if (typeof photo === 'string') {
        const trimmed = photo.trim();

        if (trimmed !== '') {
            return trimmed;
        }
    }

    return getFacultyPlaceholder(seed);
}
