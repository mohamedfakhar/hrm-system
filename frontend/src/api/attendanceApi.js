import api from './axios';

export const checkIn = () => api.post('/attendance/checkin');
export const checkOut = () => api.post('/attendance/checkout');
export const getTodayStatus = () => api.get('/attendance/today');
export const getMyAttendance = () => api.get('/attendance/me');
export const getAllAttendance = (date) => api.get('/attendance', { params: { date } });