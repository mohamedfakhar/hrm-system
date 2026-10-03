import api from './axios';

export const getAllEvaluations = (params = {}) => api.get('/performance', { params });

export const getEvaluationById = (id) => api.get(`/performance/${id}`);

export const getEmployeeEvaluations = (employeeId) =>
  api.get(`/performance/employee/${employeeId}`);

export const getMyEvaluations = () => api.get('/performance/me');

export const getAttendancePreview = (employeeId, startDate, endDate) =>
  api.get('/performance/preview-attendance', {
    params: { employeeId, startDate, endDate }
  });

export const createEvaluation = (data) => api.post('/performance', data);

export const updateEvaluation = (id, data) => api.put(`/performance/${id}`, data);

export const finalizeEvaluation = (id) => api.post(`/performance/${id}/finalize`);

export const deleteEvaluation = (id) => api.delete(`/performance/${id}`);
