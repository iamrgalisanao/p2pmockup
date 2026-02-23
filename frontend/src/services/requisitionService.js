import api from './api';

export const requisitionService = {
    getAll: (params) => api.get('/requisitions', { params }),
    getById: (id) => api.get(`/requisitions/${id}`),
    create: (data) => api.post('/requisitions', data),
    update: (id, data) => api.put(`/requisitions/${id}`, data),
    submit: (id) => api.post(`/requisitions/${id}/submit`),

    // Quotes & Awarding
    getQuotes: (id) => api.get(`/requisitions/${id}/quotes`),
    awardQuote: (prId, quoteId, justification) =>
        api.post(`/requisitions/${prId}/quotes/${quoteId}/award`, {
            override_justification: justification
        }),

    // Approval
    getApprovalSteps: (prId) => api.get(`/requisitions/${prId}/approval-steps`),
    actOnStep: (prId, stepId, action, comment) =>
        api.post(`/requisitions/${prId}/approval-steps/${stepId}/act`, { action, comment }),

    // Documents
    generateDoc: (prId, type) => api.post(`/requisitions/${prId}/documents/generate`, { type }, { responseType: 'blob' }),
    viewDoc: (prId, type) => api.get(`/requisitions/${prId}/documents/view`, { params: { type } }),
    markSent: (prId, type) => api.post(`/requisitions/${prId}/documents/mark-sent`, { type }),
    complete: (prId, comment) => api.post(`/requisitions/${prId}/complete`, { comment }),
};
