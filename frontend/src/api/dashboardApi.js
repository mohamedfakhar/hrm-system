import axios from 'axios';

// HR Stats
export const getHRStats = async () => {
  const res = await axios.get('/api/hr/stats');
  return res.data;
};

// Employee Stats
export const getEmployeeStats = async () => {
  const res = await axios.get('/api/employee/stats');
  return res.data;
};