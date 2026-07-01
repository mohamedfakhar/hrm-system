import api from './axios';

export const getAllEmployees  = ()       => api.get('/employees');
export const getMyProfile    = ()       => api.get('/employees/me');
export const createEmployee  = (data)   => api.post('/employees', data);
export const updateEmployee  = (id, data) => api.put(`/employees/${id}`, data);
export const deleteEmployee  = (id)     => api.delete(`/employees/${id}`);