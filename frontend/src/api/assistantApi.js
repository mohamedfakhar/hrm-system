import api from './axios';

export const askAssistant = (message) =>
  api.post('/intelligence/assistant/chat', { message });

export const getAssistantLogs = (params = {}) =>
  api.get('/intelligence/assistant/logs', { params });
