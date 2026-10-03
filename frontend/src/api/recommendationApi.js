import api from './axios';

export const getRecommendations = (params = {}) =>
  api.get('/intelligence/recommendations', { params });

export const getRecommendationStats = () =>
  api.get('/intelligence/recommendations/stats');

export const getRecommendation = (id) =>
  api.get(`/intelligence/recommendations/${id}`);

export const generateRecommendations = () =>
  api.post('/intelligence/recommendations/generate');

export const acceptRecommendation = (id, review_notes) =>
  api.post(`/intelligence/recommendations/${id}/accept`, { review_notes });

export const rejectRecommendation = (id, review_notes) =>
  api.post(`/intelligence/recommendations/${id}/reject`, { review_notes });
