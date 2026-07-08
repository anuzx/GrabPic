import { createContext, useState, useEffect, ReactNode } from 'react';

export interface GrabPicContextType {
  user: MockUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  events: MockEvent[];
  pendingRedirect: string | null;
  signIn: (provider: 'google' | 'github') => void;
  signOut: () => void;
  addEvent: (title: string, description?: string) => MockEvent;
  joinEvent: (code: string) => MockEvent | null;
  removeEvent: (id: string) => void;
  clearPendingRedirect: () => void;
}

export interface MockUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  provider: 'google' | 'github';
}

export interface MockEvent {
  id: string;
  title: string;
  description: string | null;
  code: string;
  photoCount: number;
  role: 'OWNER' | 'MEMBER';
  createdAt: string;
}

const MOCK_USER: MockUser = {
  id: 'user-1',
  name: 'Alex Kim',
  email: 'alex@example.com',
  avatar: 'AK',
  provider: 'google',
};

const INITIAL_EVENTS: MockEvent[] = [
  { id: 'evt-1', title: 'Company Offsite 2026', description: null, code: 'A3X9K2', photoCount: 142, role: 'OWNER', createdAt: new Date().toISOString() },
  { id: 'evt-2', title: "Maya's Wedding", description: null, code: 'B7F2M1', photoCount: 89, role: 'MEMBER', createdAt: new Date().toISOString() },
  { id: 'evt-3', title: 'SF Marathon 2026', description: null, code: 'C4K8P3', photoCount: 217, role: 'MEMBER', createdAt: new Date().toISOString() },
  { id: 'evt-4', title: 'Graduation Party', description: null, code: 'D2R5N9', photoCount: 63, role: 'OWNER', createdAt: new Date().toISOString() },
  { id: 'evt-5', title: 'Team Hackathon', description: null, code: 'E9V1Q7', photoCount: 34, role: 'OWNER', createdAt: new Date().toISOString() },
];

const EVENT_TITLES = [
  'Joined Event', 'Birthday Bash', 'Team Celebration', 'Weekend Gathering',
  'Photo Walk', 'Summer Meetup', 'Friends Reunion', 'Annual Gala',
];

export const GrabPicContext = createContext<GrabPicContextType | undefined>(undefined);

export function GrabPicProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<MockEvent[]>(INITIAL_EVENTS);
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('grabpic_auth');
    if (stored === 'true') {
      const provider = (localStorage.getItem('grabpic_provider') as 'google' | 'github') || 'google';
      const avatarUrl = provider === 'google' 
        ? 'https://lh3.googleusercontent.com/a/default-user=s96-c'
        : 'https://avatars.githubusercontent.com/u/583231?v=4';
      
      setUser({
        ...MOCK_USER,
        provider,
        avatar: avatarUrl
      });
    }
    setIsLoading(false);
  }, []);

  // Internal join logic that returns the event and updates state via a callback
  const joinEventInternal = (code: string, currentEvents: MockEvent[]): { event: MockEvent | null; updatedEvents: MockEvent[] | null } => {
    if (!code || code.length < 1) return { event: null, updatedEvents: null };

    const normalizedCode = code.toUpperCase();

    // Check if the user already has this event in their list
    const existing = currentEvents.find(e => e.code.toUpperCase() === normalizedCode);
    if (existing) {
      return { event: existing, updatedEvents: null };
    }

    // For any valid 6-char code not in the user's list, create a new mock event
    if (code.length === 6) {
      const randomTitle = EVENT_TITLES[Math.floor(Math.random() * EVENT_TITLES.length)];
      const newEvent: MockEvent = {
        id: 'evt-' + Date.now(),
        title: randomTitle,
        description: null,
        code: normalizedCode,
        photoCount: Math.floor(Math.random() * 150) + 10,
        role: 'MEMBER',
        createdAt: new Date().toISOString(),
      };
      return { event: newEvent, updatedEvents: [newEvent, ...currentEvents] };
    }

    return { event: null, updatedEvents: null };
  };

  const signIn = (provider: 'google' | 'github') => {
    const avatarUrl = provider === 'google' 
      ? 'https://lh3.googleusercontent.com/a/default-user=s96-c'
      : 'https://avatars.githubusercontent.com/u/583231?v=4';

    const u = { 
      ...MOCK_USER, 
      provider,
      avatar: avatarUrl
    };
    setUser(u);
    localStorage.setItem('grabpic_auth', 'true');
    localStorage.setItem('grabpic_provider', provider);

    // Check for pending join from deep link
    const pendingJoinRaw = sessionStorage.getItem('grabpic_pending_join');
    if (pendingJoinRaw) {
      try {
        const { code } = JSON.parse(pendingJoinRaw) as { code: string };
        setEvents(prev => {
          const { event, updatedEvents } = joinEventInternal(code, prev);
          if (event) {
            setPendingRedirect(`/events/${event.id}`);
          }
          sessionStorage.removeItem('grabpic_pending_join');
          return updatedEvents || prev;
        });
      } catch {
        sessionStorage.removeItem('grabpic_pending_join');
      }
    }
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('grabpic_auth');
    localStorage.removeItem('grabpic_provider');
  };

  const addEvent = (title: string, description?: string): MockEvent => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const event: MockEvent = {
      id: 'evt-' + Date.now(),
      title,
      description: description || null,
      code,
      photoCount: 0,
      role: 'OWNER',
      createdAt: new Date().toISOString(),
    };
    setEvents(prev => [event, ...prev]);
    return event;
  };

  const joinEvent = (code: string): MockEvent | null => {
    const { event, updatedEvents } = joinEventInternal(code, events);
    if (updatedEvents) {
      setEvents(updatedEvents);
    }
    return event;
  };

  const removeEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const clearPendingRedirect = () => {
    setPendingRedirect(null);
  };

  return (
    <GrabPicContext.Provider value={{ user, isAuthenticated: !!user, isLoading, events, pendingRedirect, signIn, signOut, addEvent, joinEvent, removeEvent, clearPendingRedirect }}>
      {children}
    </GrabPicContext.Provider>
  );
}
