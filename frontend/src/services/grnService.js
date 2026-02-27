import api from './api';

export const grnService = {
    getAll: (params) => api.get('/grns', { params }),
    getById: (id) => api.get(`/grns/${id}`),
    create: (data) => api.post('/grns', data),
};
