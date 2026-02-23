import api from './api';

export const paymentRequestService = {
    getAll: (params) => api.get('/payment-requests', { params }),
    getById: (id) => api.get(`/payment-requests/${id}`),
    create: (data) => api.post('/payment-requests', data),
    update: (id, data) => api.put(`/payment-requests/${id}`, data),
    delete: (id) => api.delete(`/payment-requests/${id}`),
    submit: (id) => api.post(`/payment-requests/${id}/submit`),
    act: (requestId, stepId, data) => api.post(`/payment-requests/${requestId}/approvals/${stepId}/act`, data),
};
