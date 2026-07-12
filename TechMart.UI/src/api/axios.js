import axios from 'axios';

const api = axios.create({
  // Use environment variable for AWS deployment, fallback to localhost for development
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5019/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
