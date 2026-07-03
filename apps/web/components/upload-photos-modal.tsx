"use client";

import { useRef, useState } from "react";
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getSignedUrl, confirmPhotos } from "@/api/events";

interface UploadPhotosModalProps {
  open: boolean;
  onClose: () => void;
  eventId: string;
}

interface UploadedFile {
  publicId: string;
  url: string;
  width: number;
  height: number;
}

export function UploadPhotosModal({ open, onClose, eventId }: UploadPhotosModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<UploadedFile[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
      setUploaded([]);
      setDone(false);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);

    try {
      const signed = await getSignedUrl(eventId);
      const results: UploadedFile[] = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", signed.apiKey);
        formData.append("timestamp", String(signed.timestamp));
        formData.append("signature", signed.signature);
        formData.append("folder", signed.folder);

        const resp = await fetch(
          `https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`,
          { method: "POST", body: formData },
        );

        if (!resp.ok) {
          const err = await resp.json();
          throw new Error(err.error?.message || "Upload failed");
        }

        const result = await resp.json();
        results.push({
          publicId: result.public_id,
          url: result.secure_url,
          width: result.width,
          height: result.height,
        });
      }

      setUploaded(results);
    } catch (e: any) {
      alert(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleConfirm = async () => {
    if (uploaded.length === 0) return;
    setConfirming(true);
    try {
      await confirmPhotos(eventId, uploaded);
      setDone(true);
    } finally {
      setConfirming(false);
    }
  };

  const reset = () => {
    setFiles([]);
    setUploaded([]);
    setDone(false);
    setConfirming(false);
    setUploading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogHeader>
        <DialogTitle>{done ? "Upload Complete" : "Upload Photos"}</DialogTitle>
      </DialogHeader>

      {done ? (
        <div className="py-4 text-center">
          <p className="text-green-600 font-medium">
            {uploaded.length} {uploaded.length === 1 ? "photo" : "photos"} uploaded successfully!
          </p>
          <p className="mt-1 text-sm text-zinc-500">Face embeddings are being generated.</p>
          <DialogFooter>
            <Button onClick={handleClose}>Done</Button>
          </DialogFooter>
        </div>
      ) : uploaded.length > 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-zinc-600">
            {uploaded.length} {uploaded.length === 1 ? "file" : "files"} uploaded. Confirm to save?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={confirming}>
              {confirming ? "Confirming..." : "Confirm"}
            </Button>
          </DialogFooter>
        </div>
      ) : (
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          {files.length === 0 ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-zinc-300 px-6 py-10 text-sm text-zinc-500 hover:border-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Click to select photos</span>
              <span className="text-xs text-zinc-400">Multiple files allowed</span>
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium text-zinc-700">
                {files.length} {files.length === 1 ? "file" : "files"} selected
              </p>
              <div className="max-h-40 space-y-1 overflow-y-auto">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-zinc-500">
                    <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="truncate">{f.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto h-6 w-6 p-0"
                      onClick={() => setFiles(files.filter((_, j) => j !== i))}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  Add more
                </Button>
                <Button size="sm" onClick={() => setFiles([])}>
                  Clear
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={files.length === 0 || uploading}>
              {uploading ? "Uploading..." : `Upload to Cloudinary`}
            </Button>
          </DialogFooter>
        </div>
      )}
    </Dialog>
  );
}