import axios from 'axios';

const getBackendUrl = () => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_BACKEND_URL) {
    return (import.meta as any).env.VITE_BACKEND_URL;
  }
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_BACKEND_URL) {
    return process.env.NEXT_PUBLIC_BACKEND_URL;
  }
  return 'http://localhost:5000'; // Default port for backend
};

const getAiServiceUrl = () => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_AI_SERVICE_URL) {
    return (import.meta as any).env.VITE_AI_SERVICE_URL;
  }
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_AI_SERVICE_URL) {
    return process.env.NEXT_PUBLIC_AI_SERVICE_URL;
  }
  return 'http://localhost:8000'; // Default port for AI service
};

// Backend API Instance
export const backendApi = axios.create({
  baseURL: getBackendUrl(),
  withCredentials: true, // For sending cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// AI Service API Instance
export const aiServiceApi = axios.create({
  baseURL: getAiServiceUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// You can add global interceptors here
// backendApi.interceptors.response.use(
//   (response) => response,
//   (error) => Promise.reject(error)
// );
