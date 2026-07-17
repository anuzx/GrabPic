import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useParams } from 'wouter';
import { ArrowLeft, Copy, Upload, Search, LogOut, Check, Trash2, QrCode, Sun, Moon, Download } from 'lucide-react';
import { PhotoGrid } from '../components/PhotoGrid';
import { UploadPhotosModal } from '../components/UploadPhotosModal';
import { FaceSearchModal } from '../components/FaceSearchModal';
import { FaceScanGate } from '../components/FaceScanGate';
import { QRCodeModal } from '../components/QRCodeModal';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { useGrabPic } from '../context/useGrabPic';
import { backendService } from '@/lib/api';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useTheme } from 'next-themes';
import { toggleThemeWithTransition } from '../lib/theme';
import { haptic } from '../lib/haptic';
import { CustomAlert } from '../components/CustomAlert';

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

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const eventId = id || '';
  const [, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();
  
  const { events, removeEvent, leaveEvent } = useGrabPic();
  const event = events.find(e => e.id === eventId);
  
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [matchedPhotoIds, setMatchedPhotoIds] = useState<string[]>(() => {
    const saved = localStorage.getItem(`grabpic_matched_ids_${eventId}`);
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showMatchBanner, setShowMatchBanner] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isQROpen, setIsQROpen] = useState(false);
  const [hasFaceScanned, setHasFaceScanned] = useState(() => 
    localStorage.getItem(`grabpic_face_scanned_${eventId}`) === 'true'
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  // Refs for GSAP animations
  const mainContentRef = useRef<HTMLElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const codeBtnRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  const fetchPhotos = React.useCallback(async () => {
    if (!event) return;
    setIsLoading(true);
    try {
      const response = await backendService.getEventPhotos(eventId);
      const photosData = response.data?.photos || [];
      setAllPhotos(photosData);
    } catch (err) {
      console.error('Failed to fetch event photos', err);
    } finally {
      setIsLoading(false);
    }
  }, [eventId, event]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  // 3.1 — Event Header Entrance Timeline
  useEffect(() => {
    if (!mainContentRef.current || !event) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // 1. Title
      tl.from('.event-title', {
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        clearProps: 'opacity,transform'
      });

      // 2. Photo count badge & code pill
      tl.from('.header-badge', {
        scale: 0.8,
        opacity: 0,
        stagger: 0.1,
        duration: 0.5,
        ease: 'back.out(2)',
        clearProps: 'opacity,transform,scale'
      }, '-=0.3');

      // 3. Description paragraph
      tl.from('.event-description', {
        y: 20,
        opacity: 0,
        duration: 0.5,
        clearProps: 'opacity,transform'
      }, '-=0.2');

      // 4. Action buttons
      tl.from('.action-btn-group > *', {
        x: 30,
        opacity: 0,
        stagger: 0.08,
        duration: 0.5,
        ease: 'power3.out',
        clearProps: 'opacity,transform'
      }, '-=0.3');
    }, mainContentRef);

    return () => ctx.revert();
  }, [event]);

  // 3.2 — Match Banner Slide-In
  useEffect(() => {
    if (!bannerRef.current) return;
    let timeout: NodeJS.Timeout;

    if (showMatchBanner) {
      const el = bannerRef.current;
      const checkIcon = el.querySelector('.banner-check-icon');

      // Set initial state
      gsap.set(el, { y: -40, opacity: 0 });

      // Slide in
      gsap.to(el, {
        y: 0,
        opacity: 1,
        duration: 0.6,
        ease: 'power3.out',
      });

      // Rotate check icon in
      if (checkIcon) {
        gsap.fromTo(checkIcon,
          { rotation: -180 },
          { rotation: 0, duration: 0.5, ease: 'power3.out', delay: 0.1 }
        );
      }

      // Slide out after 4.5s
      timeout = setTimeout(() => {
        gsap.to(el, {
          y: -40,
          opacity: 0,
          duration: 0.4,
          ease: 'power2.in',
          onComplete: () => setShowMatchBanner(false),
        });
      }, 4500);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [showMatchBanner]);

  // 3.4 — Copy Code Feedback
  useEffect(() => {
    if (!codeBtnRef.current || !copiedCode) return;

    gsap.fromTo(codeBtnRef.current,
      { scale: 0.95 },
      { scale: 1, duration: 0.4, ease: 'back.out(3)' }
    );
  }, [copiedCode]);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const trigger = ScrollTrigger.create({
      trigger: 'body',
      start: 'top -40',
      onToggle: self => {
        if (self.isActive) {
          header.classList.add('header-scrolled');
        } else {
          header.classList.remove('header-scrolled');
        }
      }
    });

    return () => trigger.kill();
  }, []);

  if (!event) {
    return (
      <div className="min-h-[100dvh] w-full flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-sans tracking-tight mb-4">Event not found</h2>
          <button 
            onClick={() => {
              haptic.light();
              setLocation('/dashboard');
            }} 
            className="text-primary hover:underline"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleCopyCode = () => {
    haptic.success();
    navigator.clipboard.writeText(event.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleLeaveEvent = async () => {
    haptic.error();
    setIsLeaving(true);
    try {
      await leaveEvent(eventId);
      localStorage.removeItem(`grabpic_face_scanned_${eventId}`);
      localStorage.removeItem(`grabpic_matched_ids_${eventId}`);
      setLocation('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLeaving(false);
    }
  };

  const handleDeleteEvent = async () => {
    haptic.error();
    setIsDeleting(true);
    try {
      await removeEvent(eventId);
      localStorage.removeItem(`grabpic_face_scanned_${eventId}`);
      localStorage.removeItem(`grabpic_matched_ids_${eventId}`);
      setLocation('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadAll = async () => {
    haptic.success();
    const matchedPhotos = allPhotos.filter(p => matchedPhotoIds.includes(p.id));
    if (matchedPhotos.length === 0) return;
    
    setIsDownloading(true);
    try {
      const response = await backendService.downloadPhotos(eventId, matchedPhotoIds);
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `event-${eventId}-photos.zip`;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download matched photos ZIP', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSearchComplete = (matches: string[]) => {
    handleFaceScanComplete(matches);
  };

  const handleFaceScanComplete = (matchedIds: string[]) => {
    setMatchedPhotoIds(matchedIds);
    setHasFaceScanned(true);
    localStorage.setItem(`grabpic_face_scanned_${eventId}`, 'true');
    localStorage.setItem(`grabpic_matched_ids_${eventId}`, JSON.stringify(matchedIds));
    setShowMatchBanner(true);
    // Banner dismissal is now handled by the GSAP slide-out animation (3.2)
  };

  return (
    <div className="min-h-[100dvh] w-full bg-background flex flex-col">
      {/* Top Nav */}
      <header ref={headerRef} className="h-16 border-b border-border flex items-center justify-between px-4 sm:px-6 sticky top-0 bg-background/80 backdrop-blur-md z-30 transition-all duration-300">
        <div className="flex items-center">
          <button 
            onClick={() => {
              haptic.selection();
              setLocation('/dashboard');
            }}
            className="mr-4 text-muted-foreground hover:text-foreground transition-colors p-2 -ml-2"
            aria-label="Back to dashboard"
            title="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[22%] overflow-hidden bg-card border border-border shadow-sm flex items-center justify-center select-none">
              <img src="/logo.png" alt="GrabPic Logo" className="w-[106%] h-[106%] object-cover scale-[1.06]" />
            </div>
            <span className="logo-text text-xl font-black tracking-tighter text-foreground origin-left select-none">
              GRAB<span className="text-[#ff5722]">PIC</span>
            </span>
          </div>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={(e) => {
            haptic.light();
            toggleThemeWithTransition(e, theme, setTheme);
          }}
          className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-muted"
          title="Toggle theme"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </header>

      {/* Main Content */}
      <main ref={mainContentRef} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 md:py-12">
        {/* Match Banner */}
        {showMatchBanner && (
          <div
            ref={bannerRef}
            style={{ opacity: 0, transform: 'translateY(-40px)' }}
            className="mb-8"
          >
            <CustomAlert 
              type="success"
              title="Photos Matched!"
              description={`We found ${matchedPhotoIds.length} photos containing your face layout in this album.`}
            />
          </div>
        )}

        {/* Event Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-12">
          <div>
            <h1 className="event-title text-4xl md:text-5xl font-sans font-light tracking-[-0.03em] text-foreground mb-3">
              {event.title}
            </h1>
            <div className="flex items-center gap-3">
              <span className="header-badge bg-card border border-border px-3 py-1 rounded-full text-sm font-medium text-foreground">
                {event.photoCount || allPhotos.length} photos
              </span>
              <button 
                ref={codeBtnRef}
                onClick={handleCopyCode}
                className="header-badge bg-muted px-3 py-1 rounded-full text-sm font-mono text-foreground flex items-center gap-2 hover:bg-muted/80 transition-colors border border-transparent"
              >
                {event.code}
                {copiedCode ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            {event.description && (
              <p className="event-description mt-4 text-body max-w-2xl">{event.description}</p>
            )}
          </div>
          
          <div className="action-btn-group flex gap-3 shrink-0 flex-wrap">
            {event.role === 'OWNER' ? (
              <>
                <AlertDialog.Root>
                  <AlertDialog.Trigger asChild>
                    <button 
                      onClick={() => haptic.warning()}
                      className="bg-transparent text-muted-foreground border border-transparent hover:border-destructive hover:text-destructive h-10 px-4 rounded-[8px] font-medium transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Event
                    </button>
                  </AlertDialog.Trigger>
                  <AlertDialog.Portal>
                    <AlertDialog.Overlay className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                    <AlertDialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 bg-popover p-6 shadow-none border border-border rounded-[12px]">
                      <AlertDialog.Title className="text-xl font-sans tracking-tight">Delete this event?</AlertDialog.Title>
                      <AlertDialog.Description className="text-body text-sm">
                        This action cannot be undone. All photos will be permanently removed.
                      </AlertDialog.Description>
                      <div className="flex justify-end gap-3 mt-4">
                        <AlertDialog.Cancel asChild>
                          <button 
                            onClick={() => haptic.light()}
                            className="bg-secondary text-secondary-foreground border border-secondary-border h-10 px-4 rounded-[8px] font-medium hover:bg-muted transition-colors"
                          >
                            Cancel
                          </button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action asChild>
                          <button 
                            onClick={handleDeleteEvent}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground h-10 px-4 rounded-[8px] font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                          >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                          </button>
                        </AlertDialog.Action>
                      </div>
                    </AlertDialog.Content>
                  </AlertDialog.Portal>
                </AlertDialog.Root>

                <button 
                  onClick={handleCopyCode}
                  className="bg-secondary text-secondary-foreground border border-secondary-border h-10 px-4 rounded-[8px] font-medium transition-colors hover:bg-muted"
                >
                  {copiedCode ? 'Copied!' : 'Share Code'}
                </button>
                <button 
                  onClick={() => {
                    haptic.light();
                    setIsQROpen(true);
                  }}
                  className="bg-secondary text-secondary-foreground border border-secondary-border h-10 px-4 rounded-[8px] font-medium transition-colors hover:bg-muted flex items-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  Share QR
                </button>
                <button 
                  onClick={() => {
                    haptic.light();
                    setIsUploadOpen(true);
                  }}
                  className="bg-primary text-primary-foreground h-10 px-4 rounded-[8px] font-medium transition-opacity hover:opacity-90 flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Photos
                </button>
                {hasFaceScanned && allPhotos.filter(p => matchedPhotoIds.includes(p.id)).length > 0 && (
                  <button 
                    onClick={handleDownloadAll}
                    disabled={isDownloading}
                    className="bg-primary text-primary-foreground h-10 px-4 rounded-[8px] font-medium transition-opacity hover:opacity-90 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    {isDownloading ? 'Downloading...' : 'Download My Photos'}
                  </button>
                )}
              </>
            ) : (
              <>
                {hasFaceScanned && allPhotos.filter(p => matchedPhotoIds.includes(p.id)).length > 0 && (
                  <button 
                    onClick={handleDownloadAll}
                    disabled={isDownloading}
                    className="bg-primary text-primary-foreground h-10 px-4 rounded-[8px] font-medium transition-opacity hover:opacity-90 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    {isDownloading ? 'Downloading...' : 'Download My Photos'}
                  </button>
                )}

                <AlertDialog.Root>
                  <AlertDialog.Trigger asChild>
                    <button 
                      onClick={() => haptic.warning()}
                      className="bg-transparent text-muted-foreground border border-transparent hover:border-border h-10 px-4 rounded-[8px] font-medium transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Leave Event
                    </button>
                  </AlertDialog.Trigger>
                  <AlertDialog.Portal>
                    <AlertDialog.Overlay className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                    <AlertDialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 bg-popover p-6 shadow-none border border-border rounded-[12px]">
                      <AlertDialog.Title className="text-xl font-sans tracking-tight">Leave this event?</AlertDialog.Title>
                      <AlertDialog.Description className="text-body text-sm">
                        You will no longer be able to see these photos unless you rejoin with the code.
                      </AlertDialog.Description>
                      <div className="flex justify-end gap-3 mt-4">
                        <AlertDialog.Cancel asChild>
                          <button 
                            onClick={() => haptic.light()}
                            className="bg-secondary text-secondary-foreground border border-secondary-border h-10 px-4 rounded-[8px] font-medium hover:bg-muted transition-colors"
                          >
                            Cancel
                          </button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action asChild>
                          <button 
                            onClick={handleLeaveEvent}
                            disabled={isLeaving}
                            className="bg-destructive text-destructive-foreground h-10 px-4 rounded-[8px] font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                          >
                            {isLeaving ? 'Leaving...' : 'Leave Event'}
                          </button>
                        </AlertDialog.Action>
                      </div>
                    </AlertDialog.Content>
                  </AlertDialog.Portal>
                </AlertDialog.Root>
              </>
            )}

            {/* Find My Photos / Re-scan button: hidden for members who haven't scanned (gate handles it) */}
            {(event.role === 'OWNER' || (event.role === 'MEMBER' && hasFaceScanned)) && (
              <button 
                onClick={() => {
                  haptic.light();
                  setIsSearchOpen(true);
                }}
                className="bg-primary text-primary-foreground h-10 px-4 rounded-[8px] font-medium transition-opacity hover:opacity-90 flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                {event.role === 'MEMBER' && hasFaceScanned ? 'Re-scan Face' : 'Find My Photos'}
              </button>
            )}
          </div>
        </div>

        {/* Photos / Face Scan Gate */}
        {event.role === 'OWNER' ? (
          <PhotoGrid 
            photos={allPhotos} 
            matchedPhotoIds={matchedPhotoIds} 
            eventId={eventId} 
            isLoading={isLoading} 
            totalEventPhotosCount={allPhotos.length}
          />
        ) : !hasFaceScanned ? (
          <FaceScanGate eventId={eventId} onScanComplete={handleFaceScanComplete} />
        ) : (
          <PhotoGrid 
            photos={allPhotos.filter(p => matchedPhotoIds.includes(p.id))} 
            matchedPhotoIds={matchedPhotoIds} 
            eventId={eventId} 
            isLoading={isLoading} 
            totalEventPhotosCount={allPhotos.length}
            onRescan={() => setIsSearchOpen(true)}
          />
        )}
      </main>

      <UploadPhotosModal 
        isOpen={isUploadOpen} 
        onClose={() => {
          setIsUploadOpen(false);
          fetchPhotos();
        }} 
        eventId={eventId} 
      />
      <FaceSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onSearchComplete={handleSearchComplete} eventId={eventId} />
      <QRCodeModal isOpen={isQROpen} onClose={() => setIsQROpen(false)} event={{ title: event.title, code: event.code }} />
    </div>
  );
}