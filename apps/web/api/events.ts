import { api } from "./auth";

export interface EventData {
  id: string;
  title: string;
  description: string | null;
  code: string;
}

export type EventMembership = UserMembership;

export interface UserMembership {
  id: string;
  eventId: string;
  userId: string;
  role: "OWNER" | "MEMBER";
  joinedAt: string;
  event?: EventData;
}

export interface PhotoData {
  id: string;
  eventId: string;
  uploadedById: string;
  url: string;
  publicId: string;
  width: number | null;
  height: number | null;
  createdAt: string;
}

export interface EventDetail {
  id: string;
  title: string;
  description: string | null;
  code: string;
  createdById: string;
  createdAt: string;
  _count: { photos: number };
  photos: PhotoData[];
}

export async function createEvent(title: string, description?: string) {
  const { data } = await api.post("/api/events", { title, description });
  return data.data.event as EventData;
}

export async function joinEvent(code: string) {
  const { data } = await api.post("/api/events/join", { code });
  return data.data as { id: string; eventId: string; role: "OWNER" | "MEMBER" };
}

export async function getMyEvents() {
  const { data } = await api.get("/api/events");
  return data.data as EventMembership[];
}

export async function getEvent(eventId: string) {
  const { data } = await api.get(`/api/events/${eventId}`);
  return data.data as EventDetail;
}

export async function getPhotos(eventId: string, cursor?: string) {
  const params = cursor ? `?cursor=${cursor}` : "";
  const { data } = await api.get(`/api/events/${eventId}/photos${params}`);
  return data as { photos: PhotoData[]; nextCursor: string | null };
}

export async function deleteEvent(eventId: string) {
  await api.delete(`/api/events/${eventId}`);
}

export async function leaveEvent(eventId: string) {
  await api.post(`/api/events/${eventId}/leave`);
}

interface SignedUrlResponse {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
}

export async function getSignedUrl(eventId: string) {
  const { data } = await api.get(`/api/events/${eventId}/signed-url`);
  return data as SignedUrlResponse;
}

interface ConfirmPhoto {
  publicId: string;
  url: string;
  width?: number;
  height?: number;
}

export async function confirmPhotos(eventId: string, photos: ConfirmPhoto[]) {
  const { data } = await api.post(`/api/events/${eventId}/photos/confirm`, { photos });
  return data.data as { count: number };
}

export async function searchFace(eventId: string, facePhotoUrl: string) {
  const { data } = await api.post(`/api/events/${eventId}/photos/search-face`, { facePhotoUrl });
  return data.data as { photos: PhotoData[] };
}

export async function downloadPhotos(eventId: string, photoIds: string[]) {
  const resp = await api.post(
    `/api/events/${eventId}/download`,
    { photoIds },
    { responseType: "blob" },
  );
  const url = window.URL.createObjectURL(new Blob([resp.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `event-${eventId}-photos.zip`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}