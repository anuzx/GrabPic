import { aiServiceApi } from './axios';

export const aiService = {
  health: () => aiServiceApi.get('/health'),
  processPhotos: (data: any) => aiServiceApi.post('/process-photos', data),
  searchFace: (data: any) => aiServiceApi.post('/search-face', data),
};
