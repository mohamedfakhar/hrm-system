import api from './axios';

// HR + Admin Dashboard Stats
export const getHRStats = () => api.get('/dashboard/hr-stats');

// Employee Dashboard Stats
export const getEmployeeStats = () => api.get('/dashboard/employee-stats');