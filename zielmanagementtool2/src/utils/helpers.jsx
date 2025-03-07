export const getStatusColor = (status) => {
    switch (status) {
        case 'planned':
            return 'info';
        case 'in_progress':
            return 'warning';
        case 'completed':
            return 'success';
        default:
            return 'default';
    }
};

export const getCategoryLabel = (category) => {
    switch (category) {
        case 'technical':
            return 'Technical Skills';
        case 'soft':
            return 'Soft Skills';
        case 'education':
            return 'Education & Training';
        case 'project':
            return 'Project Delivery';
        default:
            return category;
    }
};