import React, { useState, useRef, useEffect } from 'react';
import { ScanFace, Camera } from 'lucide-react';
import { FaceSearchModal } from './FaceSearchModal';
import gsap from 'gsap';
import { haptic } from '../lib/haptic';

interface FaceScanGateProps {
  onScanComplete: (matchedPhotoIds: string[]) => void;
  eventId: string;
}

export function FaceScanGate({ onScanComplete, eventId }: FaceScanGateProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pulseIconRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleSearchComplete = (matchedPhotoIds: string[]) => {
    onScanComplete(matchedPhotoIds);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      // Entrance animation for the container
      gsap.fromTo(container,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
      );

      // Pulse icon animation
      if (pulseIconRef.current) {
        gsap.to(pulseIconRef.current, {
          scale: 1.08,
          duration: 1.2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut'
        });
      }

      // Radiating ring effect (sonar radiating scan ring)
      if (ringRef.current) {
        gsap.fromTo(ringRef.current,
          { scale: 0.9, opacity: 0.5 },
          {
            scale: 1.8,
            opacity: 0,
            duration: 2,
            repeat: -1,
            ease: 'power1.out'
          }
        );
      }

      // Text and Button stagger entrance
      const elements = [titleRef.current, descRef.current, buttonRef.current];
      gsap.fromTo(elements.filter(Boolean),
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.15,
          duration: 0.6,
          delay: 0.3,
          ease: 'power3.out'
        }
      );

      // Button hover attention pulse
      const button = buttonRef.current;
      if (button) {
        let hoverPulse: gsap.core.Tween | null = null;
        
        button.addEventListener('mouseenter', () => {
          hoverPulse = gsap.to(button, {
            scale: 1.03,
            duration: 0.8,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
          });
        });

        button.addEventListener('mouseleave', () => {
          if (hoverPulse) {
            hoverPulse.kill();
          }
          gsap.to(button, { scale: 1, duration: 0.3, ease: 'power2.out' });
        });
      }
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        className="w-full bg-card border border-border rounded-[16px] p-12 md:p-16 flex flex-col items-center text-center"
        style={{ opacity: 0 }}
      >
        {/* Pulsing Icon with Radiating Rings */}
        <div className="relative w-24 h-24 mb-8 flex items-center justify-center">
          {/* Radiating Radar Ring */}
          <div 
            ref={ringRef}
            className="absolute inset-0 rounded-full bg-primary/20 pointer-events-none"
          />
          {/* Main Pulsing Circle */}
          <div
            ref={pulseIconRef}
            className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center z-10"
          >
            <ScanFace className="w-12 h-12 text-primary" />
          </div>
        </div>

        {/* Heading */}
        <h2 ref={titleRef} className="text-2xl font-sans font-semibold tracking-tight text-foreground mb-3" style={{ opacity: 0 }}>
          Scan Your Face to View Photos
        </h2>

        {/* Subtext */}
        <p ref={descRef} className="text-body text-base max-w-md mb-8 leading-relaxed" style={{ opacity: 0 }}>
          Take a quick selfie so we can find the photos you appear in. Your face data is processed securely and never stored permanently.
        </p>

        {/* CTA Button */}
        <button
          ref={buttonRef}
          onClick={() => {
            haptic.medium();
            setIsSearchOpen(true);
          }}
          className="bg-primary text-primary-foreground h-12 px-8 rounded-[10px] font-medium transition-opacity hover:opacity-90 flex items-center gap-3 text-base"
          style={{ opacity: 0 }}
          data-testid="button-scan-face"
        >
          <Camera className="w-5 h-5" />
          Scan My Face
        </button>

        {/* Privacy Note */}
        <p className="text-xs text-muted-foreground mt-6">
          Your selfie is used only for matching and is deleted after processing.
        </p>
      </div>

      <FaceSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSearchComplete={handleSearchComplete}
        eventId={eventId}
      />
    </>
  );
}
