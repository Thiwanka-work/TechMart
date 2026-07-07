import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5019/api', // Will connect to our .NET Web API
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
