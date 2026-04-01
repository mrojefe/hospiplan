import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const api = {
  getStaff: () => apiClient.get('staff/'),
  getShifts: () => apiClient.get('shifts/'),
  getAssignments: () => apiClient.get('assignments/'),
  createAssignment: (data) => apiClient.post('assignments/', data),
};

export default apiClient;
