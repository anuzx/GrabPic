"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { UploadPhotosModal } from "@/components/upload-photos-modal";
import { ScanFaceModal } from "@/components/scan-face-modal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import {
  getEvent,
  getPhotos,
  deleteEvent,
  leaveEvent,
  searchFace,
  type EventDetail,
  type PhotoData,
  type EventMembership,
} from "@/api/events";

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const { user, loading: authLoading } = useAuth();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [membership, setMembership] = useState<{ role: string } | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [matchedPhotoIds, setMatchedPhotoIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/");
    }
  }, [user, authLoading, router]);

  const fetchDetail = useCallback(async () => {
    try {
      const detail = await getEvent(eventId);
      setEvent(detail);
      setPhotos(detail.photos || []);
      if (detail.photos && detail.photos.length >= 20) {
        setNextCursor(detail.photos[detail.photos.length - 1]?.id || null);
      }

      const { getMyEvents } = await import("@/api/events");
      const events = await getMyEvents();
      const membership = events.find((m: any) => m.eventId === eventId);
      if (membership) {
        setMembership(membership);
      }
    } catch {
      router.replace("/dashboard");
    } finally {
      setLoading(false);
    }
  }, [eventId, router]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const loadMore = async () => {
    if (!nextCursor) return;
    try {
      const result = await getPhotos(eventId, nextCursor);
      setPhotos((prev) => [...prev, ...result.photos]);
      setNextCursor(result.nextCursor);
    } catch {}
  };

  const handleDelete = async () => {
    if (!confirm("Delete this event? This cannot be undone.")) return;
    await deleteEvent(eventId);
    router.push("/dashboard");
  };

  const handleLeave = async () => {
    await leaveEvent(eventId);
    router.push("/dashboard");
  };

  const handlePhotosFound = (foundPhotos: PhotoData[]) => {
    setMatchedPhotoIds(new Set(foundPhotos.map((p) => p.id)));
  };

  const isOwner = membership?.role === "OWNER";

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar
        showSettings
        eventCode={event.code}
        showUpload={isOwner}
        showScan
        onUploadClick={() => setShowUpload(true)}
        onScanClick={() => setShowScan(true)}
      />

      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">{event.title}</h1>
            {event.description && (
              <p className="mt-1 text-zinc-500">{event.description}</p>
            )}
            <p className="mt-1 text-sm text-zinc-400">
              {event._count.photos} {event._count.photos === 1 ? "photo" : "photos"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowScan(true)}>
              <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Find My Photos
            </Button>
            {isOwner ? (
              <Button variant="ghost" size="sm" onClick={handleDelete} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                Delete
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={handleLeave} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                Leave
              </Button>
            )}
          </div>
        </div>

        {matchedPhotoIds.size > 0 && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
            <p className="text-sm font-medium text-green-700">
              Found {matchedPhotoIds.size} {matchedPhotoIds.size === 1 ? "photo" : "photos"} with your face!
            </p>
          </div>
        )}

        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-zinc-500">No photos yet.</p>
            {isOwner && (
              <Button className="mt-4" onClick={() => setShowUpload(true)}>
                Upload Photos
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className={`group relative aspect-square overflow-hidden rounded-lg border bg-zinc-100 ${
                    matchedPhotoIds.has(photo.id)
                      ? "border-green-400 ring-2 ring-green-300"
                      : "border-zinc-200"
                  }`}
                >
                  <img
                    src={photo.url}
                    alt=""
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                  {matchedPhotoIds.has(photo.id) && (
                    <div className="absolute right-2 top-2 rounded-full bg-green-500 px-2 py-0.5 text-xs font-medium text-white">
                      Match
                    </div>
                  )}
                </div>
              ))}
            </div>

            {nextCursor && (
              <div className="mt-6 flex justify-center">
                <Button variant="outline" onClick={loadMore}>
                  Load More Photos
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      {isOwner && (
        <UploadPhotosModal
          open={showUpload}
          onClose={() => setShowUpload(false)}
          eventId={eventId}
        />
      )}

      {showScan && (
        <ScanFaceModal
          open={showScan}
          onClose={() => setShowScan(false)}
          eventId={eventId}
          onPhotosFound={handlePhotosFound}
        />
      )}
    </div>
  );
}