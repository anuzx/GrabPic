import axios from 'axios';

// Backend API Instance
export const backendApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000',
  withCredentials: true, //  cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// AI Service 
export const aiServiceApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// You can add global interceptors here
// backendApi.interceptors.response.use(
//   (response) => response,
//   (error) => Promise.reject(error)
// );
