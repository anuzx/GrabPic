import { backendApi } from './axios';

export const backendService = {
  // Auth endpoints
  authGoogle: () => backendApi.get('/auth/google'),
  authGithub: () => backendApi.get('/auth/github'),
  logout: () => backendApi.post('/api/users/logout'),
  getMe: () => backendApi.get('/api/users/me'),

  // Event endpoints
  createEvent: (data: any) => backendApi.post('/api/events', data),
  listEvents: () => backendApi.get('/api/events'),
  joinEvent: (data: any) => backendApi.post('/api/events/join', data),
  getEvent: (eventId: string) => backendApi.get(`/api/events/${eventId}`),
  deleteEvent: (eventId: string) => backendApi.delete(`/api/events/${eventId}`),
  leaveEvent: (eventId: string) => backendApi.post(`/api/events/${eventId}/leave`),
  
  // Photo endpoints
  getEventPhotos: (eventId: string, cursor?: string) => 
    backendApi.get(`/api/events/${eventId}/photos`, { params: cursor ? { cursor } : undefined }),
  getSignedUrl: (eventId: string) => backendApi.get(`/api/events/${eventId}/signed-url`),
  confirmPhotosUpload: (eventId: string, data: any) => 
    backendApi.post(`/api/events/${eventId}/photos/confirm`, data),
  searchFace: (eventId: string, data: any) => 
    backendApi.post(`/api/events/${eventId}/photos/search-face`, data),
  downloadPhotos: (eventId: string) => 
    backendApi.post(`/api/events/${eventId}/download`),
};
