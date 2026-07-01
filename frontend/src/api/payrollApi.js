import api from './axios';

export const generatePayroll = (month, year) => api.post('/payroll/generate', { month, year });
export const getAllPayroll = (month, year) => api.get('/payroll', { params: { month, year } });
export const getMyPayroll = () => api.get('/payroll/me');
export const markAsPaid = (id) => api.put(`/payroll/${id}/pay`);