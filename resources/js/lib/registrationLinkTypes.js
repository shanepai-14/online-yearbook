export const REGISTRATION_LINK_TYPES = {
    free_year_free_department: {
        value: 'free_year_free_department',
        label: 'Free Department + Free Year',
        allowsYearSelection: true,
        allowsDepartmentSelection: true,
        requiresFixedYear: false,
        requiresFixedDepartment: false,
    },
    fixed_year_select_department: {
        value: 'fixed_year_select_department',
        label: 'Fixed Year + Select Department',
        allowsYearSelection: false,
        allowsDepartmentSelection: true,
        requiresFixedYear: true,
        requiresFixedDepartment: false,
    },
    fixed_department_select_year: {
        value: 'fixed_department_select_year',
        label: 'Fixed Department + Select Year',
        allowsYearSelection: true,
        allowsDepartmentSelection: false,
        requiresFixedYear: false,
        requiresFixedDepartment: true,
    },
    fixed_year_fixed_department: {
        value: 'fixed_year_fixed_department',
        label: 'Fixed Department + Fixed Year',
        allowsYearSelection: false,
        allowsDepartmentSelection: false,
        requiresFixedYear: true,
        requiresFixedDepartment: true,
    },
};

export const REGISTRATION_LINK_TYPE_LIST = Object.values(REGISTRATION_LINK_TYPES);

export function registrationTypeMeta(type) {
    return REGISTRATION_LINK_TYPES[type] ?? REGISTRATION_LINK_TYPES.free_year_free_department;
}
