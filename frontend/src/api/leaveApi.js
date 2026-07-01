import api from './axios';

export const createLeave  = (data)         => api.post('/leaves', data);
export const getMyLeaves  = ()             => api.get('/leaves/me');
export const getAllLeaves  = (status)       => api.get('/leaves', { params: { status } });
export const approveLeave = (id)           => api.put(`/leaves/${id}/approve`);
export const rejectLeave  = (id, reason)   => api.put(`/leaves/${id}/reject`, { rejection_reason: reason });