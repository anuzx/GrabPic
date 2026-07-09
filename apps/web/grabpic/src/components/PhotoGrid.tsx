import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Download, X, ChevronLeft, ChevronRight, Check, Camera, Search } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { haptic } from '../lib/haptic';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '../components/ui/empty';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from 'boneyard-js/react';
import Masonry from 'react-masonry-css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export interface Photo {
  id: string;
  url: string;
  eventId: string;
  publicId: string;
  width: number;
  height: number;
  createdAt: string;
}

interface PhotoGridProps {
  photos: Photo[];
  matchedPhotoIds: string[];
  eventId: string;
  isLoading?: boolean;
  totalEventPhotosCount?: number;
  onRescan?: () => void;
}

function PhotoGridSkeleton() {
  const heights = [250, 320, 450, 300, 350, 400, 300, 450];
  const breakpointColumnsObj = {
    default: 4,
    1100: 3,
    700: 2,
    500: 2
  };
  return (
    <Masonry
      breakpointCols={breakpointColumnsObj}
      className="my-masonry-grid animate-pulse"
      columnClassName="my-masonry-grid_column"
    >
      {heights.map((height, i) => (
        <div 
          key={i} 
          className="bg-muted rounded-[12px] w-full" 
          style={{ height: `${height}px` }} 
        />
      ))}
    </Masonry>
  );
}

export function PhotoGrid({ photos, matchedPhotoIds, eventId, isLoading = false, totalEventPhotosCount = 0, onRescan }: PhotoGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { toast } = useToast();
  const gridRef = useRef<HTMLDivElement>(null);
  const lightboxImgRef = useRef<HTMLImageElement>(null);
  const lightboxOverlayRef = useRef<HTMLDivElement>(null);
  const prevLightboxIndex = useRef<number | null>(null);

  const photoItems = (photos || []).map(p => ({
    ...p,
    isMatch: (matchedPhotoIds || []).includes(p.id)
  }));

  const openLightbox = (index: number) => {
    haptic.medium();
    setLightboxIndex(index);
  };
  const closeLightbox = () => {
    haptic.light();
    setLightboxIndex(null);
  };
  
  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null && lightboxIndex < photoItems.length - 1) {
      haptic.snap();
      prevLightboxIndex.current = lightboxIndex;
      setLightboxIndex(lightboxIndex + 1);
    }
  };
  
  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null && lightboxIndex > 0) {
      haptic.snap();
      prevLightboxIndex.current = lightboxIndex;
      setLightboxIndex(lightboxIndex - 1);
    }
  };

  const downloadPhoto = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    haptic.success();
    toast({ title: 'Download Started', description: 'Your photo is downloading.' });
    window.open(url, '_blank');
  };
  // Phase 4.1: ScrollTrigger batch stagger for photo cards
  useEffect(() => {
    if (isLoading || !gridRef.current || photoItems.length === 0) return;

    const ctx = gsap.context(() => {
      const cards = gridRef.current!.querySelectorAll('.photo-card');
      if (cards.length === 0) return;

      // Set initial state
      gsap.set(cards, { opacity: 0, y: 50, scale: 0.95 });

      // Batch animation — cards animate as they enter viewport
      ScrollTrigger.batch(cards, {
        onEnter: (elements) => {
          gsap.to(elements, {
            opacity: 1,
            y: 0,
            scale: 1,
            stagger: 0.06,
            duration: 0.6,
            ease: 'power3.out',
            clearProps: 'opacity,transform,scale'
          });
        },
        start: 'top 92%',
      });

      // Refresh ScrollTrigger to parse elements correctly on initial load
      ScrollTrigger.refresh();
    }, gridRef.current);

    return () => ctx.revert();
  }, [isLoading, photoItems.length]);

  // Phase 4.2: Photo card hover zoom (GSAP-powered)
  const handlePhotoMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const img = card.querySelector('img');
    const overlay = card.querySelector('.photo-overlay');
    if (img) {
      gsap.to(img, { scale: 1.06, duration: 0.5, ease: 'power2.out' });
    }
    if (overlay) {
      gsap.to(overlay, { opacity: 1, backgroundColor: 'rgba(0,0,0,0.2)', duration: 0.3 });
    }
  }, []);

  const handlePhotoMouseLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const img = card.querySelector('img');
    const overlay = card.querySelector('.photo-overlay');
    if (img) {
      gsap.to(img, { scale: 1, duration: 0.6, ease: 'power2.inOut' });
    }
    if (overlay) {
      gsap.to(overlay, { opacity: 0, backgroundColor: 'rgba(0,0,0,0)', duration: 0.3 });
    }
  }, []);

  // Phase 4.3: Lightbox image entrance animation
  useEffect(() => {
    if (lightboxIndex !== null && lightboxImgRef.current) {
      const direction = prevLightboxIndex.current !== null 
        ? (lightboxIndex > prevLightboxIndex.current ? 1 : -1) 
        : 0;
      
      if (direction !== 0) {
        // Navigating between photos — slide transition
        gsap.fromTo(lightboxImgRef.current, 
          { x: direction * 80, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.35, ease: 'power2.out' }
        );
      } else {
        // Opening lightbox — scale/fade in
        gsap.fromTo(lightboxImgRef.current,
          { scale: 0.85, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.45, ease: 'power3.out' }
        );
      }
    }
    if (lightboxIndex === null) {
      prevLightboxIndex.current = null;
    }
  }, [lightboxIndex]);

  // Animate match badge pulse
  useEffect(() => {
    if (!gridRef.current) return;
    const badges = gridRef.current.querySelectorAll('.match-badge');
    if (badges.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.to(badges, {
        scale: 1.1,
        repeat: -1,
        yoyo: true,
        duration: 1.5,
        ease: 'sine.inOut',
      });
    }, gridRef.current);

    return () => ctx.revert();
  }, [photoItems.length, matchedPhotoIds.length]);

  if (photoItems.length === 0 && !isLoading) {
    const hasPhotosInEvent = totalEventPhotosCount > 0;
    return (
      <Empty className="relative overflow-hidden bg-card/40 border-2 border-dashed border-border rounded-2xl p-12 md:p-16 flex flex-col items-center justify-center min-h-[300px] bg-dot-grid">
        <div className="absolute w-40 h-40 bg-[#ff5722]/5 blur-[50px] rounded-full pointer-events-none -translate-x-1/2 left-1/2 top-6" />
        <EmptyMedia variant="icon" className="animate-empty-float bg-primary/10 border border-primary/25 rounded-2xl w-14 h-14 flex items-center justify-center text-primary shadow-lg shadow-primary/10 mb-2">
          <Camera className="w-7 h-7" />
        </EmptyMedia>
        <EmptyHeader className="z-10 flex flex-col gap-1.5 max-w-sm text-center items-center">
          <EmptyTitle className="text-xl font-bold tracking-tight text-foreground">
            {hasPhotosInEvent ? 'No Matches Found' : 'No Photos Yet'}
          </EmptyTitle>
          <EmptyDescription className="text-sm text-muted-foreground leading-normal">
            {hasPhotosInEvent 
              ? "We scanned all photos in this album but couldn't find your face. Try re-scanning with a clearer selfie, or check back later as more photos get uploaded!"
              : "This album is currently empty. Photos added to this event will be automatically processed using facial indexing."}
          </EmptyDescription>
          {hasPhotosInEvent && onRescan && (
            <button
              onClick={() => {
                haptic.light();
                onRescan();
              }}
              className="mt-4 bg-primary text-primary-foreground h-10 px-6 rounded-[8px] font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Scan Again
            </button>
          )}
        </EmptyHeader>
      </Empty>
    );
  }

  const breakpointColumnsObj = {
    default: 4,
    1100: 3,
    700: 2,
    500: 2
  };

  return (
    <>
      <Skeleton name="photo-grid" loading={isLoading} fallback={<PhotoGridSkeleton />}>
        <div ref={gridRef}>
          <Masonry
            breakpointCols={breakpointColumnsObj}
            className="my-masonry-grid"
            columnClassName="my-masonry-grid_column"
          >
            {photoItems.map((photo, i) => (
              <div
                key={photo.id}
                className={`photo-card relative rounded-[12px] overflow-hidden cursor-pointer group bg-muted border ${photo.isMatch ? 'border-success border-2' : 'border-border'}`}
                onClick={() => openLightbox(i)}
                onMouseEnter={handlePhotoMouseEnter}
                onMouseLeave={handlePhotoMouseLeave}
              >
                <img 
                  src={photo.url} 
                  alt={`Event photo ${i + 1}`} 
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
                
                {/* Match Badge */}
                {photo.isMatch && (
                  <div className="match-badge absolute top-2 right-2 bg-success text-white text-xs font-semibold px-2 py-1 rounded-full shadow-sm flex items-center gap-1 z-10">
                    <Check className="w-3 h-3" /> Match
                  </div>
                )}
                
                {/* Hover Overlay */}
                <div className="photo-overlay absolute inset-0 flex items-center justify-center" style={{ opacity: 0, backgroundColor: 'rgba(0,0,0,0)' }}>
                  <button 
                    onClick={(e) => downloadPhoto(e, photo.url)}
                    className="bg-white/90 text-black p-2 rounded-full hover:bg-white transition-colors"
                    title="Download"
                    aria-label={`Download photo ${i + 1}`}
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </Masonry>
        </div>
      </Skeleton>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Dialog.Root open={true} onOpenChange={(open) => !open && closeLightbox()}>
          <Dialog.Portal>
            <Dialog.Overlay ref={lightboxOverlayRef} className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
              <div className="absolute top-4 right-4 flex items-center gap-4 z-50">
                <button 
                  onClick={(e) => downloadPhoto(e, photoItems[lightboxIndex].url)}
                  className="text-white/70 hover:text-white p-2 transition-colors flex items-center gap-2 text-sm"
                  aria-label="Download current photo"
                >
                  <Download className="w-5 h-5" />
                  <span className="hidden sm:inline">Download</span>
                </button>
                <button 
                  onClick={closeLightbox}
                  className="text-white/70 hover:text-white p-2 transition-colors"
                  aria-label="Close lightbox"
                  title="Close lightbox"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="absolute inset-0 flex items-center justify-center px-12 sm:px-24">
                <img 
                  ref={lightboxImgRef}
                  src={photoItems[lightboxIndex].url} 
                  alt="Full screen photo" 
                  className="max-w-full max-h-[85vh] object-contain rounded-md"
                />
                {photoItems[lightboxIndex].isMatch && (
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-success text-white px-4 py-2 rounded-full font-medium flex items-center gap-2 shadow-lg">
                    <Check className="w-5 h-5" /> This is you
                  </div>
                )}
              </div>

              {lightboxIndex > 0 && (
                <button 
                  onClick={prevPhoto}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-2 transition-colors z-50"
                  aria-label="Previous photo"
                  title="Previous photo"
                >
                  <ChevronLeft className="w-10 h-10" />
                </button>
              )}
              
              {lightboxIndex < photoItems.length - 1 && (
                <button 
                  onClick={nextPhoto}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-2 transition-colors z-50"
                  aria-label="Next photo"
                  title="Next photo"
                >
                  <ChevronRight className="w-10 h-10" />
                </button>
              )}
            </Dialog.Overlay>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </>
  );
}
