import api from './api';

export const reportService = {
    getCostComparison: (prId) => api.get(`/reports/cost-comparison/${prId}`),

    exportComparison: (prId) => {
        const url = `${api.defaults.baseURL}/reports/cost-comparison/${prId}/export`;
        // Use window.open or a hidden anchor for downloads
        window.open(url, '_blank');
    },

    exportRequisition: (prId) => {
        const url = `${api.defaults.baseURL}/reports/requisitions/${prId}/export`;
        window.open(url, '_blank');
    },

    getDashboardStats: () => api.get('/dashboard/stats'),
};
