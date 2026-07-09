import React, { useState, useRef, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Upload, File as FileIcon, CheckCircle2 } from 'lucide-react';
import { haptic } from '../lib/haptic';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { CustomAlert } from './CustomAlert';

import { backendService } from '@repo/api';

type UploadStep = 'select' | 'progress' | 'done';

const STATUS_PILLS = [
  { id: 'thinking', label: 'Thinking', color: '#dfa88f' },
  { id: 'grepping', label: 'Grepping', color: '#9fc9a2' },
  { id: 'reading', label: 'Reading', color: '#9fbbe0' },
  { id: 'editing', label: 'Editing', color: '#c0a8dd' },
  { id: 'done', label: 'Done', color: '#c08532' }
];

export function UploadPhotosModal({ isOpen, onClose, eventId }: { isOpen: boolean, onClose: () => void, eventId: string }) {
  const [step, setStep] = useState<UploadStep>('select');
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [activePillIndex, setActivePillIndex] = useState(-1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Refs for animations
  const progressIconRef = useRef<SVGSVGElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const progressShimmerRef = useRef<HTMLDivElement>(null);
  const checkCircleRef = useRef<HTMLDivElement>(null);
  const pillsContainerRef = useRef<HTMLDivElement>(null);
  const doneBtnRef = useRef<HTMLButtonElement>(null);
  const particleContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep('select');
        setFiles([]);
        setProgress(0);
        setActivePillIndex(-1);
      }, 300);
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      haptic.light();
      setFiles(Array.from(e.target.files));
    }
  };

  const startUpload = async () => {
    haptic.medium();
    setStep('progress');
    setProgress(0);
    
    try {
      // 1. Get signed Cloudinary credentials from backend
      const signedUrlRes = await backendService.getSignedUrl(eventId);
      const { signature, timestamp, apiKey, cloudName, folder } = signedUrlRes.data;

      const uploadedPhotos: any[] = [];
      let completedFiles = 0;

      // 2. Upload files to Cloudinary
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', apiKey);
        formData.append('timestamp', timestamp.toString());
        formData.append('signature', signature);
        formData.append('folder', folder);

        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => ({}));
          throw new Error(errData.error?.message || `Cloudinary upload failed: ${uploadRes.statusText}`);
        }

        const cloudinaryData = await uploadRes.json();
        uploadedPhotos.push({
          publicId: cloudinaryData.public_id,
          url: cloudinaryData.secure_url,
          width: cloudinaryData.width,
          height: cloudinaryData.height,
        });

        completedFiles++;
        setProgress((completedFiles / files.length) * 100);
      }

      // 3. Confirm the uploads with the backend
      await backendService.confirmPhotosUpload(eventId, {
        photos: uploadedPhotos,
      });

      startProcessing();
    } catch (err) {
      console.error('Upload failed', err);
      haptic.warning();
      setStep('select');
      alert('Upload failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const startProcessing = () => {
    setStep('done');
    let current = 0;
    
    const pillInterval = setInterval(() => {
      setActivePillIndex(current);
      current++;
      if (current > STATUS_PILLS.length) {
        clearInterval(pillInterval);
      }
    }, 600);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    haptic.drag();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    haptic.drop();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(Array.from(e.dataTransfer.files));
    }
  };

  // 6.1 Progress Bar & Icon Animations
  useEffect(() => {
    if (step !== 'progress') return;

    const ctx = gsap.context(() => {
      // Smoother upload icon bounce
      if (progressIconRef.current) {
        gsap.to(progressIconRef.current, {
          y: -12,
          repeat: -1,
          yoyo: true,
          duration: 0.6,
          ease: 'power2.inOut'
        });
      }

      // Shimmer sliding effect
      if (progressShimmerRef.current) {
        gsap.to(progressShimmerRef.current, {
          x: '400px',
          duration: 1.5,
          repeat: -1,
          ease: 'none'
        });
      }
    });

    return () => ctx.revert();
  }, [step]);

  // Update progress bar width smoothly
  useEffect(() => {
    if (step === 'progress' && progressBarRef.current) {
      gsap.to(progressBarRef.current, {
        width: `${Math.min(100, progress)}%`,
        duration: 0.25,
        ease: 'power2.out'
      });
    }
  }, [progress, step]);

  // 6.2 Done State Animations (Pills pop, Done button, Confetti/Particles)
  useEffect(() => {
    if (step !== 'done') return;

    const ctx = gsap.context(() => {
      // Checkmark bounce
      if (checkCircleRef.current) {
        gsap.fromTo(checkCircleRef.current,
          { scale: 0 },
          { scale: 1, duration: 0.6, ease: 'back.out(2)' }
        );
      }
    });

    return () => ctx.revert();
  }, [step]);

  // Pill Activation Effect
  useEffect(() => {
    if (step !== 'done' || activePillIndex === -1) return;

    if (activePillIndex === STATUS_PILLS.length - 1) {
      haptic.success();
    } else {
      haptic.snap();
    }

    const ctx = gsap.context(() => {
      const pills = pillsContainerRef.current?.children;
      if (!pills) return;

      const activePill = pills[activePillIndex] as HTMLElement;
      if (activePill) {
        // Pop scaling effect
        gsap.fromTo(activePill,
          { scale: 0.95 },
          {
            scale: 1.05,
            duration: 0.2,
            yoyo: true,
            repeat: 1,
            ease: 'back.out(3)'
          }
        );

        // Background color transition to active color
        const pillData = STATUS_PILLS[activePillIndex];
        gsap.to(activePill, {
          backgroundColor: pillData.color,
          color: '#1a1916',
          border: 'none',
          opacity: 1,
          boxShadow: `0 0 16px ${pillData.color}50`,
          duration: 0.3
        });
      }

      // Particle explosion when "Done" pill is reached
      if (activePillIndex === STATUS_PILLS.length - 1 && particleContainerRef.current) {
        const particlesCount = 20;
        const container = particleContainerRef.current;
        
        for (let i = 0; i < particlesCount; i++) {
          const p = document.createElement('div');
          p.className = 'absolute w-1.5 h-1.5 rounded-full pointer-events-none';
          
          // Random color from status pills
          const colors = STATUS_PILLS.map(pl => pl.color);
          p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
          p.style.left = '50%';
          p.style.top = '50%';
          container.appendChild(p);

          // Fly outward
          const angle = Math.random() * Math.PI * 2;
          const distance = 40 + Math.random() * 60;
          const destX = Math.cos(angle) * distance;
          const destY = Math.sin(angle) * distance;

          gsap.to(p, {
            x: destX,
            y: destY,
            scale: 0,
            opacity: 0,
            duration: 0.8 + Math.random() * 0.4,
            ease: 'power2.out',
            onComplete: () => p.remove()
          });
        }

        // Animate Done button entrance
        if (doneBtnRef.current) {
          gsap.fromTo(doneBtnRef.current,
            { opacity: 0, y: 15, scale: 0.9 },
            { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'back.out(2)' }
          );
        }
      }
    });

    return () => ctx.revert();
  }, [activePillIndex, step]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 bg-popover p-6 shadow-none border border-border rounded-[12px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <div className="flex justify-between items-center">
            <Dialog.Title className="text-xl font-sans tracking-tight text-foreground">Upload Photos</Dialog.Title>
            <Dialog.Close 
              onClick={() => haptic.light()}
              className="rounded-full p-1.5 hover:bg-muted text-muted-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          
          <div className="mt-2 min-h-[300px] flex flex-col relative">
            {/* Particle explosion space */}
            <div ref={particleContainerRef} className="absolute inset-0 pointer-events-none z-20" />

            <AnimatePresence mode="wait">
              {step === 'select' && (
                <motion.div
                  key="select"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex-1 flex flex-col"
                >
                  <div 
                    className="border-2 border-dashed border-border rounded-[12px] flex-1 flex flex-col items-center justify-center p-8 text-center bg-background/50 cursor-pointer hover:bg-background transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <Upload className="w-8 h-8 text-muted-foreground mb-4" />
                    <p className="text-sm font-medium text-foreground mb-1">Click to choose files or drag here</p>
                    <p className="text-xs text-muted-foreground">JPEG, PNG up to 10MB each</p>
                    <input 
                      type="file" 
                      multiple 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/jpeg, image/png"
                    />
                  </div>
                  
                  {files.length > 0 && (
                    <div className="mt-6 flex flex-col gap-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">{files.length} files selected</span>
                        <span className="text-muted-foreground">{(files.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(1)} MB total</span>
                      </div>
                      <div className="h-32 overflow-y-auto border border-border rounded-[8px] p-2 bg-background flex flex-col gap-1">
                        {files.slice(0, 10).map((f, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs py-1 px-2 rounded hover:bg-muted">
                            <FileIcon className="w-3 h-3 text-muted-foreground" />
                            <span className="truncate flex-1">{f.name}</span>
                            <span className="text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</span>
                          </div>
                        ))}
                        {files.length > 10 && (
                          <div className="text-center text-xs text-muted-foreground py-2 italic">
                            + {files.length - 10} more
                          </div>
                        )}
                      </div>
                      
                      {files.length > 20 && (
                        <CustomAlert 
                          type="error"
                          title="Upload Limit Reached"
                          description="You can upload a maximum of 20 photos per batch. Please remove some photos to proceed."
                          className="animate-haptic-shake border-red-500/30 bg-red-500/10 text-red-500"
                        />
                      )}
                      
                      <button
                        onClick={startUpload}
                        disabled={files.length > 20}
                        className="bg-primary text-primary-foreground h-10 px-4 rounded-[8px] font-medium transition-opacity hover:opacity-90 w-full disabled:opacity-50 disabled:pointer-events-none"
                        data-testid="button-start-upload"
                      >
                        Upload {files.length} photos
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {step === 'progress' && (
                <motion.div
                  key="progress"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="flex-1 flex flex-col items-center justify-center p-8 text-center"
                >
                  <Upload ref={progressIconRef} className="w-12 h-12 text-primary mb-6" />
                  <h3 className="text-lg font-medium text-foreground mb-2">Uploading your photos...</h3>
                  <div className="w-full bg-muted rounded-full h-2 mb-2 overflow-hidden relative">
                    {/* Shimmer sweep */}
                    <div 
                      ref={progressShimmerRef}
                      className="absolute top-0 bottom-0 w-24 bg-gradient-to-r from-transparent via-white/40 to-transparent z-10"
                      style={{ left: '-100px' }}
                    />
                    <div 
                      ref={progressBarRef}
                      className="bg-primary h-full w-0"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">{Math.min(100, Math.round(progress))}% complete</p>
                </motion.div>
              )}

              {step === 'done' && (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex-1 flex flex-col items-center justify-center p-6 text-center"
                >
                  <div ref={checkCircleRef}>
                    <CheckCircle2 className="w-16 h-16 text-success mb-4" />
                  </div>
                  
                  <h3 className="text-xl font-sans tracking-tight text-foreground mb-2">
                    {files.length} photos uploaded!
                  </h3>
                  <p className="text-body mb-8">Face embeddings being generated.</p>
                  
                  <div ref={pillsContainerRef} className="flex flex-wrap justify-center gap-2 mb-8">
                    {STATUS_PILLS.map((pill, index) => (
                      <div
                        key={pill.id}
                        className="px-3 py-1 rounded-full text-xs font-mono font-medium opacity-30 scale-100"
                        style={{ 
                          backgroundColor: 'transparent',
                          color: 'var(--muted-foreground)',
                          border: '1px solid var(--border)'
                        }}
                      >
                        {pill.label}
                      </div>
                    ))}
                  </div>

                  <button
                    ref={doneBtnRef}
                    disabled={activePillIndex < STATUS_PILLS.length - 1}
                    onClick={onClose}
                    className="bg-secondary text-secondary-foreground border border-secondary-border h-10 px-6 rounded-[8px] font-medium hover:bg-muted"
                    style={{ opacity: 0 }}
                  >
                    Done
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
