import api from './axios';

export const getAnomalies = (params = {}) =>
  api.get('/intelligence/anomalies', { params });

export const getAnomalyStats = () =>
  api.get('/intelligence/anomalies/stats');

export const getAnomalyById = (id) =>
  api.get(`/intelligence/anomalies/${id}`);

export const runAnomalyScan = () =>
  api.post('/intelligence/anomalies/scan');

export const reviewAnomaly = (id, resolution_note) =>
  api.post(`/intelligence/anomalies/${id}/review`, { resolution_note });

export const dismissAnomaly = (id, resolution_note) =>
  api.post(`/intelligence/anomalies/${id}/dismiss`, { resolution_note });
