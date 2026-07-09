import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useParams } from 'wouter';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGrabPic } from '../context/useGrabPic';

type JoinState = 'joining' | 'success' | 'error';

export default function JoinRedirect() {
  const { code } = useParams<{ code: string }>();
  const eventCode = code || '';
  const { user, joinEvent, isLoading } = useGrabPic();
  const [, navigate] = useLocation();
  const [joinState, setJoinState] = useState<JoinState>('joining');
  const [errorMessage, setErrorMessage] = useState('');
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (isLoading) return;

    // User is NOT authenticated
    if (!user) {
      sessionStorage.setItem('grabpic_pending_join', JSON.stringify({ code: eventCode }));
      navigate('/signin');
      return;
    }

    // User IS authenticated — attempt join
    let timer: NodeJS.Timeout | undefined;
    if (!hasAttempted.current) {
      hasAttempted.current = true;
      setJoinState('joining');

      // Small delay to show the joining state
      timer = setTimeout(async () => {
        try {
          const event = await joinEvent(eventCode);
          if (event) {
            setJoinState('success');
            // Navigate after brief success state
            setTimeout(() => {
              navigate(`/events/${event.id}`);
            }, 400);
          } else {
            setErrorMessage('Event not found. Check the code and try again.');
            setJoinState('error');
          }
        } catch (err: any) {
          setErrorMessage(err.response?.data?.message || 'Failed to join event. Check the code and try again.');
          setJoinState('error');
        }
      }, 800);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoading, user, eventCode, joinEvent, navigate]);

  // Loading state while context initializes
  if (isLoading) {
    return (
      <div className="min-h-[100dvh] w-full flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground text-sm font-medium">Loading...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-background p-6">
      <AnimatePresence mode="wait">
        {joinState === 'joining' && (
          <motion.div
            key="joining"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3 }}
            className="bg-card border border-border rounded-[16px] p-10 md:p-12 flex flex-col items-center text-center max-w-sm w-full"
          >
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-6" />
            <h2 className="text-xl font-sans font-semibold tracking-tight text-foreground mb-2">
              Joining event...
            </h2>
            <p className="text-sm text-muted-foreground">
              Connecting you to event <span className="font-mono font-medium text-foreground">{eventCode.toUpperCase()}</span>
            </p>
          </motion.div>
        )}

        {joinState === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-card border border-border rounded-[16px] p-10 md:p-12 flex flex-col items-center text-center max-w-sm w-full"
          >
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-sans font-semibold tracking-tight text-foreground mb-2">
              Failed to Join
            </h2>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              {errorMessage || `The event code '${eventCode}' is invalid or has expired.`}
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-primary text-primary-foreground h-10 px-6 rounded-[8px] font-medium transition-opacity hover:opacity-90 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Go to Dashboard
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
