import React, { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import gsap from 'gsap';
import { haptic } from '../lib/haptic';

export default function NotFound() {
  const [, setLocation] = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLHeadingElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const gridBackdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      const num = numberRef.current;
      if (num) {
        // Count up odometer effect from 000 to 404
        let obj = { val: 0 };
        gsap.to(obj, {
          val: 404,
          duration: 2.2,
          ease: "power2.out",
          onUpdate: () => {
            if (num) {
              num.textContent = Math.round(obj.val).toString().padStart(3, '0');
            }
          }
        });

        // Initial entrance glitch timeline
        const glitchTl = gsap.timeline();
        glitchTl
          .to(num, { x: -4, textShadow: '3px 0 #ff0000, -3px 0 #00ffff', opacity: 0.9, duration: 0.05 })
          .to(num, { x: 3, textShadow: '-2px 0 #ff0000, 2px 0 #00ffff', opacity: 0.8, duration: 0.05 })
          .to(num, { x: -2, textShadow: '1px 0 #ff0000, -2px 0 #00ffff', opacity: 1, duration: 0.05 })
          .to(num, { x: 4, textShadow: '-3px 0 #ff0000, 3px 0 #00ffff', opacity: 0.95, duration: 0.05 })
          .to(num, { x: -1, textShadow: '2px 0 #ff0000, -1px 0 #00ffff', opacity: 0.85, duration: 0.05 })
          .to(num, { x: 0, textShadow: 'none', opacity: 1, duration: 0.05 })
          .to(num, { scale: 1.1, duration: 0.1, ease: 'power2.out' })
          .to(num, { scale: 1, duration: 0.15, ease: 'power2.in' });

        // Continuous micro-glitch periodic trigger every 4 seconds
        gsap.to(num, {
          repeat: -1,
          repeatDelay: 4.0,
          duration: 0.25,
          onStart: () => {
            gsap.timeline()
              .to(num, { x: -2, textShadow: '1px 0 #ff0000, -1px 0 #00ffff', duration: 0.05 })
              .to(num, { x: 2, textShadow: '-1px 0 #ff0000, 1px 0 #00ffff', duration: 0.05 })
              .to(num, { x: 0, textShadow: 'none', duration: 0.05 });
          }
        });
      }

      // Stagger fade-in of subtitle text and button slide-up
      const elements = [textRef.current, btnRef.current];
      gsap.fromTo(elements.filter(Boolean),
        { opacity: 0, y: 15 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.15,
          duration: 0.6,
          delay: 0.4,
          ease: 'power3.out'
        }
      );

      // Mouse Move Parallax Effects
      const quickX = gsap.quickTo(glowRef.current, 'x', { duration: 0.8, ease: 'power2.out' });
      const quickY = gsap.quickTo(glowRef.current, 'y', { duration: 0.8, ease: 'power2.out' });
      const quickGridX = gsap.quickTo(gridBackdropRef.current, 'x', { duration: 1.2, ease: 'power2.out' });
      const quickGridY = gsap.quickTo(gridBackdropRef.current, 'y', { duration: 1.2, ease: 'power2.out' });

      const handleMouseMove = (e: MouseEvent) => {
        const { clientX, clientY } = e;
        const x = clientX - window.innerWidth / 2;
        const y = clientY - window.innerHeight / 2;

        quickX(x * 0.15);
        quickY(y * 0.15);
        quickGridX(x * 0.04);
        quickGridY(y * 0.04);
      };

      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }, container);

    return () => ctx.revert();
  }, []);

  // Magnetic Button Hover
  const handleButtonMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);

    gsap.to(btn, {
      x: x * 0.35,
      y: y * 0.35,
      duration: 0.3,
      ease: 'power2.out'
    });
  };

  const handleButtonLeave = () => {
    const btn = btnRef.current;
    if (!btn) return;
    gsap.to(btn, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: 'elastic.out(1, 0.3)'
    });
  };

  return (
    <div ref={containerRef} className="min-h-[100dvh] w-full flex items-center justify-center bg-background relative overflow-hidden">
      {/* Decorative Interactive Background elements */}
      <div 
        ref={gridBackdropRef} 
        className="absolute inset-0 bg-dot-grid opacity-60 pointer-events-none scale-105" 
      />

      <div 
        ref={glowRef}
        className="absolute w-[450px] h-[450px] rounded-full bg-primary/5 blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2"
      />

      {/* Retro Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-white/[0.01] to-transparent bg-[length:100%_4px] opacity-40 z-10" />
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        <div className="w-full h-0.5 bg-primary/10 opacity-20 animate-scanline" />
      </div>

      <div className="text-center relative z-20 px-6">
        <div className="relative inline-block mb-2 select-none">
          <h1 
            ref={numberRef} 
            className="text-8xl md:text-9xl font-mono font-light tracking-tighter text-foreground relative z-20"
          >
            000
          </h1>
          <div className="absolute -inset-2 bg-background/50 blur-md pointer-events-none z-10" />
        </div>

        <p 
          ref={textRef} 
          className="text-muted-foreground text-lg md:text-xl font-medium tracking-tight mb-8 max-w-sm mx-auto"
          style={{ opacity: 0 }}
        >
          Lost in coordinates. The album you are seeking has drifted away.
        </p>

        <button 
          ref={btnRef}
          onMouseMove={handleButtonMove}
          onMouseLeave={handleButtonLeave}
          onClick={() => {
            haptic.light();
            setLocation("/dashboard");
          }} 
          className="bg-primary text-primary-foreground h-11 px-8 rounded-full font-semibold transition-all hover:opacity-95 shadow-lg shadow-primary/25 relative"
          style={{ opacity: 0 }}
        >
          Go Home
        </button>
      </div>
    </div>
  );
}
