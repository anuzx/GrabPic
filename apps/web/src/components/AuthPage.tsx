import React, { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useGrabPic } from '../context/useGrabPic';
import { SiGithub } from 'react-icons/si';
import gsap from 'gsap';
import { haptic } from '../lib/haptic';

interface AuthPageProps {
  mode: 'signup' | 'signin';
}

export default function AuthPage({ mode }: AuthPageProps) {
  const { user, isLoading, signIn, pendingRedirect, clearPendingRedirect } = useGrabPic();
  const [, setLocation] = useLocation();

  const isSignup = mode === 'signup';

  const containerRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLHeadingElement>(null);
  const logoIconRef = useRef<HTMLDivElement>(null);
  const heroLine1Ref = useRef<HTMLSpanElement>(null);
  const heroLine2Ref = useRef<HTMLSpanElement>(null);
  const heroLine3Ref = useRef<HTMLSpanElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const authCardRef = useRef<HTMLDivElement>(null);
  const googleBtnRef = useRef<HTMLButtonElement>(null);
  const githubBtnRef = useRef<HTMLButtonElement>(null);
  const loginBtnRef = useRef<HTMLButtonElement>(null);
  const privacyRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (user && !isLoading) {
      if (pendingRedirect) {
        setLocation(pendingRedirect);
        clearPendingRedirect();
      } else {
        setLocation('/dashboard');
      }
    }
  }, [user, isLoading, setLocation, pendingRedirect, clearPendingRedirect]);

  const handleSignIn = (provider: 'google' | 'github') => {
    haptic.light();
    signIn(provider);
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      const heroLines = [heroLine1Ref.current, heroLine2Ref.current, heroLine3Ref.current];

      gsap.fromTo(
        [logoRef.current, logoIconRef.current],
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power4.out' }
      );

      gsap.fromTo(
        heroLines,
        { opacity: 0, y: 50, clipPath: 'inset(100% 0% 0% 0%)' },
        {
          opacity: 1,
          y: 0,
          clipPath: 'inset(0% 0% 0% 0%)',
          ease: 'power4.out',
          duration: 1.2,
          stagger: 0.15,
          delay: 0.5,
        }
      );

      const subtitleDelay = 0.5 + (2 * 0.15) + 0.3;
      gsap.fromTo(
        subtitleRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: subtitleDelay }
      );

      gsap.fromTo(
        authCardRef.current,
        { opacity: 0, x: 60, scale: 0.95 },
        { opacity: 1, x: 0, scale: 1, ease: 'power3.out', duration: 0.8, delay: 0.4 }
      );

      gsap.fromTo(".wipe-reveal",
        { clipPath: "inset(0 100% 0 0)", opacity: 0 },
        {
          clipPath: "inset(0 0% 0 0)",
          opacity: 1,
          duration: 1.2,
          ease: "power3.inOut",
          stagger: 0.08,
          delay: 0.2
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleButtonEnter = useCallback((btn: HTMLButtonElement | null) => {
    if (!btn) return;
    gsap.to(btn, { scale: 1.02, duration: 0.25, ease: 'power2.out' });
  }, []);

  const handleButtonLeave = useCallback((btn: HTMLButtonElement | null) => {
    if (!btn) return;
    gsap.to(btn, { scale: 1, duration: 0.3, ease: 'power2.inOut' });
  }, []);

  const handleButtonClick = useCallback((btn: HTMLButtonElement | null) => {
    if (!btn) return;
    gsap.timeline()
      .to(btn, { scale: 0.97, duration: 0.1, ease: 'power2.in' })
      .to(btn, { scale: 1, duration: 0.2, ease: 'power2.out' });
  }, []);

  return (
    <main ref={containerRef} className="min-h-[100dvh] w-full flex flex-col md:flex-row bg-background">
      {/* Left Brand Panel */}
      <div ref={leftPanelRef} className="w-full md:w-[55%] relative flex flex-col justify-between p-8 md:p-16 border-b md:border-b-0 md:border-r border-border overflow-hidden">
        {/* Background Video */}
        <video
          src="/bg-video.mov"
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
        {/* Subtle glassmorphic overlay for text readability */}
        <div className="absolute inset-0 bg-background/55 backdrop-blur-[1px] z-0"></div>

        <div className="relative z-10 flex items-center gap-3">
          <div ref={logoIconRef} className="w-10 h-10 rounded-[22%] overflow-hidden bg-card border border-border shadow-sm flex items-center justify-center select-none" style={{ opacity: 0 }}>
            <img src="/logo.png" alt="GrabPic Logo" className="w-[106%] h-[106%] object-cover scale-[1.06]" />
          </div>
          <span ref={logoRef} className="text-3xl md:text-4xl font-black tracking-tighter text-foreground" style={{ opacity: 0 }}>
            GRAB<span className="text-[#ff5722]">PIC</span>
          </span>
        </div>

        <div className="relative z-10 mt-12 md:mt-0 max-w-md">
          <h2 className="text-4xl md:text-6xl font-sans font-light tracking-[-0.04em] text-foreground leading-[1.1] mb-6">
            <span ref={heroLine1Ref} style={{ display: 'block', opacity: 0 }}>Every face.</span>
            <span ref={heroLine2Ref} style={{ display: 'block', opacity: 0 }}>Every moment.</span>
            <span ref={heroLine3Ref} style={{ display: 'block', opacity: 0 }}>Found.</span>
          </h2>
          <p ref={subtitleRef} className="text-body text-lg max-w-sm" style={{ opacity: 0 }}>
            Facial-recognition powered photo delivery for events. Drop hundreds of photos, find yours instantly.
          </p>
        </div>
      </div>

      {/* Right Auth Card */}
      <div className="w-full md:w-[45%] flex items-center justify-center p-8 md:p-12 bg-background relative z-20 overflow-y-auto min-h-[100dvh]">
        <div ref={authCardRef} className="w-full max-w-[393px] flex flex-col justify-start items-start gap-10 md:gap-12 py-8" style={{ opacity: 0 }}>
          {/* Logo / Brand Header */}
          <div className="flex flex-col justify-start items-start gap-4">
            <div className="wipe-reveal w-12 h-12 rounded-[22%] overflow-hidden bg-card border border-border shadow-sm flex items-center justify-center" style={{ opacity: 0 }}>
              <img src="/logo.png" alt="GrabPic Logo" className="w-[106%] h-[106%] object-cover scale-[1.06]" />
            </div>
            <div className="flex flex-col gap-1 w-full">
              <h1 className="wipe-reveal signin-h1 text-4xl md:text-5xl font-sans font-bold tracking-tight text-foreground leading-[1.1] min-h-[80px] md:min-h-[110px] w-full" style={{ opacity: 0 }}>
                {isSignup ? 'Make memories with us' : 'Welcome back'}
              </h1>
              <h2 className="wipe-reveal signin-h2 text-3xl md:text-4xl font-sans font-medium text-muted-foreground tracking-tight min-h-[36px] md:min-h-[40px] w-full" style={{ opacity: 0 }}>
                {isSignup ? 'Join us today' : 'Sign in to your account'}
              </h2>
            </div>
          </div>

          {/* Actions Container */}
          <div className="flex flex-col gap-4 w-full">
            {/* Google Signup */}
            <button
              ref={googleBtnRef}
              onClick={() => {
                handleButtonClick(googleBtnRef.current);
                handleSignIn('google');
              }}
              onMouseEnter={() => handleButtonEnter(googleBtnRef.current)}
              onMouseLeave={() => handleButtonLeave(googleBtnRef.current)}
              className="wipe-reveal w-full h-14 bg-card border border-border hover:bg-muted text-foreground rounded-full font-medium flex items-center justify-center gap-3 transition-colors shadow-sm text-base md:text-lg"
              data-testid="button-signin-google"
              style={{ opacity: 0 }}
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>

            {/* GitHub Signup */}
            <button
              ref={githubBtnRef}
              onClick={() => {
                handleButtonClick(githubBtnRef.current);
                handleSignIn('github');
              }}
              onMouseEnter={() => handleButtonEnter(githubBtnRef.current)}
              onMouseLeave={() => handleButtonLeave(githubBtnRef.current)}
              className="wipe-reveal w-full h-14 bg-card border border-border hover:bg-muted text-foreground rounded-full font-medium flex items-center justify-center gap-3 transition-colors shadow-sm text-base md:text-lg"
              data-testid="button-signin-github"
              style={{ opacity: 0 }}
            >
              <SiGithub className="w-5 h-5 text-foreground" aria-hidden="true" />
              Continue with GitHub
            </button>

            {/* Privacy/Agreement terms */}
            <p ref={privacyRef} className="wipe-reveal text-xs text-muted-foreground leading-relaxed pt-2" style={{ opacity: 0 }}>
              By continuing, you agree to the{' '}
              <a href="#" className="underline text-foreground hover:text-primary transition-colors">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="underline text-foreground hover:text-primary transition-colors">Privacy Policy</a>
              , including{' '}
              <a href="#" className="underline text-foreground hover:text-primary transition-colors">cookie use</a>.
            </p>
          </div>

          {/* Bottom CTA */}
          <div className="flex flex-col gap-4 w-full mt-2 pt-8 border-t border-border">
            <p className="wipe-reveal text-foreground font-medium text-base md:text-lg" style={{ opacity: 0 }}>
              {isSignup ? 'Already have an account?' : "Don't have an account?"}
            </p>
            <button
              ref={loginBtnRef}
              onClick={() => setLocation(isSignup ? '/signin' : '/signup')}
              onMouseEnter={() => handleButtonEnter(loginBtnRef.current)}
              onMouseLeave={() => handleButtonLeave(loginBtnRef.current)}
              className="wipe-reveal w-full h-14 bg-transparent border border-foreground hover:bg-muted text-foreground rounded-full font-medium flex items-center justify-center transition-colors text-base md:text-lg"
              style={{ opacity: 0 }}
            >
              {isSignup ? 'Log in' : 'Sign up'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
