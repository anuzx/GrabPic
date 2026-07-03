"use client";

import { useRef, useState } from "react";
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { searchFace, type PhotoData } from "@/api/events";

interface ScanFaceModalProps {
  open: boolean;
  onClose: () => void;
  eventId: string;
  onPhotosFound: (photos: PhotoData[]) => void;
}

export function ScanFaceModal({ open, onClose, eventId, onPhotosFound }: ScanFaceModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelfie(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleScan = async () => {
    if (!selfie) return;
    setScanning(true);

    try {
      const result = await searchFace(eventId, selfie);
      onPhotosFound(result.photos);
      onClose();
    } catch (e: any) {
      alert(e.message || "Face search failed");
    } finally {
      setScanning(false);
    }
  };

  const reset = () => {
    setSelfie(null);
    setPreview(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogHeader>
        <DialogTitle>Find Your Photos</DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {preview ? (
          <div className="flex flex-col items-center gap-3">
            <img
              src={preview}
              alt="Selfie preview"
              className="h-40 w-40 rounded-full border-2 border-zinc-200 object-cover"
            />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              Change photo
            </Button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-zinc-300 px-6 py-10 text-sm text-zinc-500 hover:border-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Upload a selfie</span>
            <span className="text-xs text-zinc-400">We&apos;ll find photos with your face</span>
          </button>
        )}

        <p className="text-xs text-zinc-400 text-center">
          Your selfie is uploaded temporarily for face matching and not stored.
        </p>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={handleClose} disabled={scanning}>
          Cancel
        </Button>
        <Button onClick={handleScan} disabled={!selfie || scanning}>
          {scanning ? "Searching..." : "Find My Photos"}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}