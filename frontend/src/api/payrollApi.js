import api from './axios';

export const generatePayroll = (monthOrData, maybeYear) => {
  const payload =
    typeof monthOrData === 'object' && monthOrData !== null
      ? monthOrData
      : { month: monthOrData, year: maybeYear };
  return api.post('/payroll/generate', payload);
};

export const getAllPayroll = (monthOrParams, maybeYear) => {
  const params =
    typeof monthOrParams === 'object' && monthOrParams !== null
      ? monthOrParams
      : { month: monthOrParams, year: maybeYear };
  return api.get('/payroll', { params });
};

export const getMyPayroll = () => api.get('/payroll/me');

export const markAsPaid = (id) => api.put(`/payroll/${id}/pay`);