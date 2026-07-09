import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useGrabPic } from '../context/useGrabPic';
import { Search, Plus, Users, LogOut, Sun, Moon, Home } from 'lucide-react';
import { EventCard } from '../components/EventCard';
import { CreateEventModal } from '../components/CreateEventModal';
import { JoinEventModal } from '../components/JoinEventModal';
import { Skeleton } from 'boneyard-js/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextPlugin } from 'gsap/TextPlugin';
import { useTheme } from 'next-themes';
import { toggleThemeWithTransition } from '../lib/theme';
import { haptic } from '../lib/haptic';
import { HapticSettingsModal } from '../components/HapticSettingsModal';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '../components/ui/empty';

gsap.registerPlugin(ScrollTrigger, TextPlugin);

function EventCardSkeleton() {
  return (
    <div className="bg-card border border-card-border rounded-[16px] p-5 flex flex-col justify-between h-[184px] animate-pulse">
      <div className="flex gap-3 items-center mb-2">
        <div className="w-8 h-8 bg-muted rounded-full" />
        <div className="h-5 bg-muted rounded w-1/2" />
      </div>
      <div className="h-3.5 bg-muted rounded w-full mb-3" />
      <div className="flex gap-4 border-t border-border pt-4 mt-auto">
        <div className="h-4 bg-muted rounded w-1/4" />
        <div className="h-4 bg-muted rounded w-1/4" />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
      <EventCardSkeleton />
      <EventCardSkeleton />
      <EventCardSkeleton />
    </div>
  );
}

export default function Dashboard() {
  const { user, events, signOut } = useGrabPic();
  const [, setLocation] = useLocation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isHapticSettingsOpen, setIsHapticSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { theme, setTheme } = useTheme();

  // Refs for GSAP animations
  const headerRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const emptyStateRef = useRef<HTMLDivElement>(null);
  const pulseLinkRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simulate loading for skeleton loader demonstration
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // Typewriter animation on welcome text
  useEffect(() => {
    if (!user) return;
    const name = user.name.split(' ')[0];
    
    // Register blinking cursor
    const cursorBlink = gsap.to(".typewriter-cursor", {
      opacity: 0,
      ease: "power2.inOut",
      repeat: -1,
      yoyo: true,
      duration: 0.5,
    });

    const tl = gsap.timeline();
    tl.to(".welcome-text", { text: `Welcom bck, ${name}`, duration: 1.2, ease: "none" })
      .to(".welcome-text", { text: `Welcome `, duration: 0.6, ease: "none", delay: 0.5 })
      .to(".welcome-text", { text: `Welcome back, ${name}!`, duration: 1.2, ease: "none", delay: 0.3 })
      .to(".typewriter-cursor", { 
        opacity: 0, 
        duration: 0.2, 
        delay: 0.5, 
        onComplete: () => {
          cursorBlink.kill();
          gsap.set(".typewriter-cursor", { display: 'none' });
        }
      });

    return () => {
      tl.kill();
      cursorBlink.kill();
    };
  }, [user?.name]);

  // 2.1 — Header Slide-Down Entrance & Scroll-linked effect
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const ctx = gsap.context(() => {
      gsap.from(header, {
        y: -20,
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out',
      });
      gsap.from(header.children, {
        y: -20,
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out',
        stagger: 0.1,
      });

      // Sticky header effect
      ScrollTrigger.create({
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
    }, header);

    return () => ctx.revert();
  }, []);

  // 2.2 — Welcome Text & Buttons Reveal
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const h2 = hero.querySelector('h2');
    const p = hero.querySelector('p');

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      if (h2) {
        tl.from(h2, {
          y: 40,
          opacity: 0,
          duration: 0.8,
          ease: 'power3.out',
          clearProps: 'opacity,transform'
        });
      }

      if (p) {
        tl.from(p, {
          y: 30,
          opacity: 0,
          duration: 0.6,
          clearProps: 'opacity,transform'
        }, '-=0.65');
      }
    }, hero);

    return () => ctx.revert();
  }, []);

  // 2.3 — Event Cards Stagger
  useEffect(() => {
    if (isLoading) return;
    const grid = gridRef.current;
    if (!grid) return;

    const ctx = gsap.context(() => {
      gsap.from('.event-card-wrapper', {
        y: 40,
        opacity: 0,
        stagger: 0.08,
        duration: 0.6,
        ease: 'power3.out',
        clearProps: 'opacity,transform'
      });
    }, grid);

    return () => ctx.revert();
  }, [isLoading]);

  // 2.5 — Empty State Entrance
  useEffect(() => {
    if (isLoading || events.length > 0) return;
    const container = emptyStateRef.current;
    const link = pulseLinkRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      gsap.from(container, {
        opacity: 0,
        y: 20,
        duration: 0.6,
        ease: 'power2.out',
        clearProps: 'opacity,transform'
      });

      if (link) {
        gsap.to(link, {
          scale: 1.03,
          repeat: -1,
          yoyo: true,
          duration: 1.5,
          ease: 'sine.inOut',
        });
      }
    }, container);

    return () => ctx.revert();
  }, [isLoading, events.length]);

  // Hover & Touch animations for Start New Album Card
  useEffect(() => {
    const card = pulseLinkRef.current;
    if (!card) return;

    const icon = card.querySelector('.plus-icon-bg');
    const plusSvg = card.querySelector('.plus-icon-svg');

    const handleMouseEnter = () => {
      gsap.to(card, {
        borderColor: '#ff5722',
        backgroundColor: 'rgba(255, 87, 34, 0.05)',
        y: -4,
        duration: 0.3,
        ease: 'power2.out',
      });
      if (icon) gsap.to(icon, { backgroundColor: '#ff5722', duration: 0.3 });
      if (plusSvg) gsap.to(plusSvg, { color: '#ffffff', duration: 0.3 });
    };

    const handleMouseLeave = () => {
      gsap.to(card, {
        borderColor: 'var(--border)',
        backgroundColor: 'transparent',
        y: 0,
        duration: 0.4,
        ease: 'power2.inOut',
      });
      if (icon) gsap.to(icon, { backgroundColor: 'var(--muted)', duration: 0.4 });
      if (plusSvg) gsap.to(plusSvg, { color: 'var(--foreground)', duration: 0.4 });
    };

    const handleTouchStart = () => {
      gsap.to(card, {
        borderColor: '#ff5722',
        backgroundColor: 'rgba(255, 87, 34, 0.05)',
        y: -4,
        duration: 0.25,
        ease: 'power2.out',
      });
      if (icon) gsap.to(icon, { backgroundColor: '#ff5722', duration: 0.25 });
      if (plusSvg) gsap.to(plusSvg, { color: '#ffffff', duration: 0.25 });
    };

    const handleTouchEnd = () => {
      gsap.to(card, {
        borderColor: 'var(--border)',
        backgroundColor: 'transparent',
        y: 0,
        duration: 0.35,
        ease: 'power2.inOut',
      });
      if (icon) gsap.to(icon, { backgroundColor: 'var(--muted)', duration: 0.35 });
      if (plusSvg) gsap.to(plusSvg, { color: 'var(--foreground)', duration: 0.35 });
    };

    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mouseleave', handleMouseLeave);
    card.addEventListener('touchstart', handleTouchStart, { passive: true });
    card.addEventListener('touchend', handleTouchEnd, { passive: true });
    card.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mouseleave', handleMouseLeave);
      card.removeEventListener('touchstart', handleTouchStart);
      card.removeEventListener('touchend', handleTouchEnd);
      card.removeEventListener('touchcancel', handleTouchEnd);
      gsap.killTweensOf(card);
      if (icon) gsap.killTweensOf(icon);
      if (plusSvg) gsap.killTweensOf(plusSvg);
    };
  }, [isLoading]);

  const handleSignOut = () => {
    haptic.warning();
    signOut();
    setLocation('/signin');
  };

  const navigateToEvent = (id: string) => {
    setLocation(`/events/${id}`);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-orange-100 flex flex-col">
      {/* Redesigned Header Component */}
      <header
        ref={headerRef}
        className="flex items-center justify-between w-full px-4 sm:px-8 py-4 bg-card border-b border-border sticky top-0 z-50 transition-all duration-300"
      >
        <div className="flex items-center gap-12">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[22%] overflow-hidden bg-card border border-border shadow-sm flex items-center justify-center select-none">
              <img src="/logo.png" alt="GrabPic Logo" className="w-[106%] h-[106%] object-cover scale-[1.06]" />
            </div>
            <span className="text-xl font-black tracking-tighter text-foreground font-sans">
              GRAB<span className="text-[#ff5722]">PIC</span>
            </span>
          </div>

          {/* Minimalist Search Bar */}
          <div className="relative group hidden md:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-[#ff5722] transition-colors" />
            <input 
              type="text" 
              placeholder="Search memories..." 
              aria-label="Search memories"
              className="pl-11 pr-4 py-2 bg-muted border-none rounded-lg text-sm w-64 focus:ring-2 focus:ring-[#ff5722]/10 focus:bg-card transition-all outline-none"
            />
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8">
            <a href="#" className="text-sm font-semibold text-foreground border-b-2 border-foreground pb-0.5">Memories</a>
            <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Favorites</a>
            <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Downloads</a>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Actions - Hidden on mobile, shown in bottom dock */}
          <button 
            onClick={() => {
              haptic.selection();
              setIsJoinOpen(true);
            }}
            className="join-event-btn-skew-hover px-3 py-2 text-sm font-semibold rounded-lg active:scale-95 flex items-center gap-1.5 hidden md:inline-flex"
          >
            <span className="relative z-10 flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>Join Event</span>
            </span>
          </button>
          <button 
            onClick={() => {
              haptic.selection();
              setIsCreateOpen(true);
            }}
            className="create-event-btn-slide-arrow flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-[#1a1a1a] rounded-lg hover:bg-black transition-all active:scale-95 shadow-sm hidden md:inline-flex"
          >
            <span>Create Event</span>
          </button>

          {/* Theme Toggle - Always in header */}
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

          {/* Logout Action - Hidden on mobile, shown in bottom dock */}
          <button 
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-foreground transition-colors p-2 ml-1 hidden md:inline-flex"
            title="Sign out"
            aria-label="Sign out"
            data-testid="button-signout"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* Pixel Avatar Profile */}
          <div 
            onClick={() => {
              haptic.light();
              setIsHapticSettingsOpen(true);
            }}
            className="p-0.5 rounded-full border border-border hover:border-[#ff5722] transition-colors cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center text-sm font-semibold text-foreground border border-border">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 pt-8 pb-24 md:py-12 flex-1">
        {/* Welcome Header */}
        <div ref={heroRef} className="mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight mb-3 flex items-center gap-1 min-h-[48px]">
            <span className="welcome-text font-sans"></span>
            <span className="typewriter-cursor text-primary opacity-100 font-sans">|</span>
          </h1>
          <p className="text-muted-foreground font-medium text-lg">
            Explore your latest memories and events.
          </p>
        </div>
        
        {/* Events Grid */}
        {events.length === 0 && !isLoading ? (
          <Empty 
            ref={emptyStateRef}
            className="relative overflow-hidden bg-card/45 border-2 border-dashed border-border rounded-2xl p-12 md:p-20 hover:border-[#ff5722]/50 transition-all duration-300 shadow-sm flex flex-col items-center justify-center min-h-[350px] bg-dot-grid"
          >
            {/* Background Glow */}
            <div className="absolute w-48 h-48 bg-primary/5 blur-[60px] rounded-full pointer-events-none -translate-x-1/2 left-1/2 top-10" />
            
            <EmptyMedia variant="icon" className="animate-empty-float bg-primary/10 border border-primary/25 rounded-2xl w-16 h-16 flex items-center justify-center text-primary shadow-lg shadow-primary/10 mb-2">
              <Plus className="w-8 h-8" />
            </EmptyMedia>
            <EmptyHeader className="z-10 flex flex-col gap-2 max-w-sm">
              <EmptyTitle className="text-2xl font-black text-foreground tracking-tight">Start New Album</EmptyTitle>
              <EmptyDescription className="text-sm text-muted-foreground leading-normal">
                No active albums yet. Create a premium event album space to start distributing photos with smart face-matching.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="z-10">
              <button
                onClick={() => {
                  haptic.light();
                  setIsCreateOpen(true);
                }}
                className="bg-primary text-primary-foreground h-11 px-6 rounded-full font-semibold transition-opacity hover:opacity-95 shadow-md shadow-primary/25"
              >
                Create First Album
              </button>
            </EmptyContent>
          </Empty>
        ) : (
          <Skeleton name="dashboard-events" loading={isLoading} fallback={<DashboardSkeleton />}>
            <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(events || []).map((event) => (
                <div key={event.id} className="event-card-wrapper">
                  <EventCard event={event} onClick={() => navigateToEvent(event.id)} />
                </div>
              ))}
              
              {/* Start New Album Card */}
              <div 
                ref={pulseLinkRef}
                onClick={(e) => {
                  e.preventDefault();
                  haptic.light();
                  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
                  if (isTouch) {
                    setTimeout(() => {
                      setIsCreateOpen(true);
                    }, 180);
                  } else {
                    setIsCreateOpen(true);
                  }
                }}
                className="border-2 border-dashed border-border rounded-[16px] flex flex-col items-center justify-center p-6 min-h-[184px] transition-all cursor-pointer group"
              >
                <div className="plus-icon-bg w-10 h-10 bg-muted rounded-full flex items-center justify-center mb-2 transition-colors">
                  <Plus className="plus-icon-svg w-5 h-5 text-foreground" />
                </div>
                <span className="text-base font-black text-foreground tracking-tight">Start New Album</span>
                <span className="text-[11px] text-muted-foreground mt-0.5 text-center">Create a space for new memories</span>
              </div>
            </div>
          </Skeleton>
        )}
      </main>

      {/* Floating Bottom Nav/Dock for Mobile (Design inspired by user - 3 Items) */}
      <div 
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 md:hidden flex items-center justify-between border border-white/[0.08] backdrop-blur-[20px] saturate-[190%]"
        style={{
          width: 180,
          height: 60,
          padding: 6,
          background: 'linear-gradient(180deg, rgba(23, 23, 23, 0.83) 0%, rgba(13, 13, 13, 0.88) 100%)',
          boxShadow: '0px 0px 2px rgba(255, 255, 255, 0.15) inset, 0 8px 32px 0 rgba(0, 0, 0, 0.37)',
          borderRadius: 99,
          gap: 4
        }}
      >
        {/* Item 1: Join Event (Default) */}
        <button 
          onClick={() => {
            haptic.light();
            setIsJoinOpen(true);
          }}
          className="cursor-pointer transition-all duration-200 active:scale-95 hover:opacity-100 opacity-35 hover:bg-white/5 rounded-full flex items-center justify-center"
          style={{ padding: 10 }}
          title="Join Event"
          aria-label="Join Event"
        >
          <Users className="w-[18px] h-[18px] text-[#EAEAEA]" />
        </button>

        {/* Item 2: Create Event (Selected Center FAB - Orange) */}
        <button 
          onClick={() => {
            haptic.medium();
            setIsCreateOpen(true);
          }}
          className="cursor-pointer transition-all active:scale-95 flex items-center justify-center border border-[#ff7043]/20 shadow-md shadow-orange-500/10"
          style={{
            padding: 10,
            background: 'linear-gradient(135deg, #ff5722 0%, #ff7043 100%)',
            boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.3), inset 0px 1px 0px rgba(255, 255, 255, 0.3)',
            borderRadius: 99
          }}
          title="Create Event"
          aria-label="Create Event"
        >
          <Plus className="w-[18px] h-[18px] text-white" />
        </button>

        {/* Item 3: Logout (Default) */}
        <button 
          onClick={handleSignOut}
          className="cursor-pointer transition-all duration-200 active:scale-95 hover:opacity-100 opacity-35 hover:bg-white/5 rounded-full flex items-center justify-center"
          style={{ padding: 10 }}
          title="Sign Out"
          aria-label="Sign Out"
        >
          <LogOut className="w-[18px] h-[18px] text-[#EAEAEA]" />
        </button>
      </div>

      <CreateEventModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <JoinEventModal isOpen={isJoinOpen} onClose={() => setIsJoinOpen(false)} />
      <HapticSettingsModal isOpen={isHapticSettingsOpen} onClose={() => setIsHapticSettingsOpen(false)} />
    </div>
  );
}
