import React, { useRef, useEffect, lazy, Suspense } from 'react';
const NotFound = lazy(() => import('@/pages/not-found'));
const SignIn = lazy(() => import('@/pages/signin'));
const Dashboard = lazy(() => import('@/pages/dashboard'));
const EventDetail = lazy(() => import('@/pages/event-detail'));
const JoinRedirect = lazy(() => import('./pages/join-redirect'));
import { Route, Switch, Router as WouterRouter, Redirect, useLocation } from 'wouter';
import { GrabPicProvider } from './context/GrabPicContext';
import { useGrabPic } from './context/useGrabPic';
import gsap from 'gsap';
import { ThemeProvider } from 'next-themes';

// Protected Route wrapper
function ProtectedRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useGrabPic();
  
  if (isLoading) {
    return <div className="min-h-[100dvh] w-full bg-background" />;
  }
  
  if (!user) {
    return <Redirect to="/signin" />;
  }
  
  return <Component {...rest} />;
}

// 8.1: PageTransition wrapper component
function PageTransition({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;

    // Trigger enter animation on route location changes
    gsap.fromTo(el,
      { opacity: 0, y: 15 },
      { 
        opacity: 1, 
        y: 0, 
        duration: 0.4, 
        ease: 'power2.out',
        clearProps: 'all' // ensures we don't interfere with fixed layout or header stickiness
      }
    );
  }, [location]);

  return (
    <div ref={pageRef} className="w-full flex-1 flex flex-col min-h-[100dvh]">
      {children}
    </div>
  );
}

function Router() {
  return (
    <PageTransition>
      <Suspense fallback={<div className="min-h-[100dvh] w-full bg-background" />}>
        <Switch>
          <Route path="/" component={() => <Redirect to="/dashboard" />} />
          <Route path="/signin" component={SignIn} />
          <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
          <Route path="/events/:id" component={() => <ProtectedRoute component={EventDetail} />} />
          <Route path="/join/:code" component={JoinRedirect} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </PageTransition>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <GrabPicProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
      </GrabPicProvider>
    </ThemeProvider>
  );
}

export default App;
