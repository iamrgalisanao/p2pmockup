import api from './api';

const departmentService = {
    getAll: () => api.get('/departments'),
    get: (id) => api.get(`/departments/${id}`),
    create: (data) => api.post('/departments', data),
    update: (id, data) => api.put(`/departments/${id}`, data),
    delete: (id) => api.delete(`/departments/${id}`),
};

export default departmentService;
