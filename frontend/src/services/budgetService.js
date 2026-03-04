import api from './api';

const budgetService = {
    getSummary: (type = 'department') => api.get(`budget?type=${type}`),
    getDetails: (id) => api.get(`budget/${id}`),
    transfer: (data) => api.post('budget/transfer', data),
    updateLimit: (id, amount) => api.put(`departments/${id}`, { budget_limit: amount }),
};

export default budgetService;
