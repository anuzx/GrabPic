import { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { backendService, backendApi } from '@/lib/api';
import { setToken, clearToken } from '@/lib/api/token';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  provider: 'google' | 'github';
}

export interface GrabPicEvent {
  id: string;
  title: string;
  description: string | null;
  code: string;
  photoCount: number;
  role: 'OWNER' | 'MEMBER';
  createdAt: string;
}

// Aliases for backward compatibility with existing components
export type MockUser = User;
export type MockEvent = GrabPicEvent;

export interface GrabPicContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  events: GrabPicEvent[];
  pendingRedirect: string | null;
  signIn: (provider: 'google' | 'github') => void;
  signOut: () => Promise<void>;
  addEvent: (title: string, description?: string) => Promise<GrabPicEvent>;
  joinEvent: (code: string) => Promise<GrabPicEvent | null>;
  removeEvent: (id: string) => Promise<void>;
  leaveEvent: (id: string) => Promise<void>;
  clearPendingRedirect: () => void;
  refetchEvents: () => Promise<void>;
}
import { GrabPicContext } from './useGrabPic';

export function GrabPicProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<GrabPicEvent[]>([]);
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      const response = await backendService.listEvents();
      const rawEvents = response.data?.data || [];
      const eventsData = rawEvents.map((member: any) => ({
        id: member.event.id,
        title: member.event.title,
        description: member.event.description,
        code: member.event.code,
        photoCount: member.event._count?.photos || 0,
        role: member.role,
        createdAt: member.event.createdAt || member.joinedAt || '',
      }));
      setEvents(eventsData);
    } catch (err) {
      console.error('Failed to fetch events', err);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      setToken(urlToken);
      window.history.replaceState({}, '', window.location.pathname);
    }

    const initAuth = async () => {
      setIsLoading(true);
      try {
        const response = await backendService.getMe();
        if (response.data && response.data.data) {
          setUser(response.data.data);
          await fetchEvents();
          
          // Check for pending join from deep link
          const pendingJoinRaw = sessionStorage.getItem('grabpic_pending_join');
          if (pendingJoinRaw) {
            try {
              const { code } = JSON.parse(pendingJoinRaw) as { code: string };
              const joinRes = await backendService.joinEvent({ code });
              if (joinRes.data && joinRes.data.data && joinRes.data.data.eventId) {
                 setPendingRedirect(`/events/${joinRes.data.data.eventId}`);
                 await fetchEvents();
              }
            } catch (e) {
              console.error('Pending join failed', e);
            } finally {
              sessionStorage.removeItem('grabpic_pending_join');
            }
          }
        }
      } catch (err) {
        // User not authenticated
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, [fetchEvents]);

  const signIn = (provider: 'google' | 'github') => {
    const backendUrl = backendApi.defaults.baseURL || 'http://localhost:5000';
    window.location.href = `${backendUrl}/api/auth/${provider}`;
  };

  const signOut = async () => {
    try {
      await backendService.logout();
    } catch (err) {
      console.error('Logout failed', err);
    }
    clearToken();
    setUser(null);
    setEvents([]);
  };

  const addEvent = async (title: string, description?: string): Promise<GrabPicEvent> => {
    const response = await backendService.createEvent({ title, description });
    const newEvent = response.data?.data?.event || response.data?.data;
    await fetchEvents();
    return newEvent;
  };

  const joinEvent = async (code: string): Promise<GrabPicEvent | null> => {
    try {
      const response = await backendService.joinEvent({ code });
      const member = response.data?.data;
      await fetchEvents();
      if (member && member.eventId) {
        return {
          id: member.eventId,
          title: '',
          description: '',
          code: code,
          photoCount: 0,
          role: 'MEMBER',
          createdAt: '',
        };
      }
      return null;
    } catch (err) {
      console.error('Failed to join event', err);
      throw err;
    }
  };

  const removeEvent = async (id: string) => {
    await backendService.deleteEvent(id);
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const leaveEvent = async (id: string) => {
    await backendService.leaveEvent(id);
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const clearPendingRedirect = () => {
    setPendingRedirect(null);
  };

  return (
    <GrabPicContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isLoading, 
      events, 
      pendingRedirect, 
      signIn, 
      signOut, 
      addEvent, 
      joinEvent, 
      removeEvent, 
      leaveEvent,
      clearPendingRedirect,
      refetchEvents: fetchEvents
    }}>
      {children}
    </GrabPicContext.Provider>
  );
}
