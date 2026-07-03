"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { EventCard } from "@/components/event-card";
import { CreateEventDialog } from "@/components/create-event-dialog";
import { JoinEventDialog } from "@/components/join-event-dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { getMyEvents, getEvent, type EventMembership } from "@/api/events";

export function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [memberships, setMemberships] = useState<EventMembership[]>([]);
  const [photoCounts, setPhotoCounts] = useState<Record<string, number>>({});
  const [fetching, setFetching] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  useEffect(() => {
    if (searchParams.get("create") === "true") {
      setShowCreate(true);
      router.replace("/dashboard");
    } else if (searchParams.get("join") === "true") {
      setShowJoin(true);
      router.replace("/dashboard");
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  const fetchEvents = useCallback(async () => {
    if (!user) return;
    setFetching(true);
    try {
      const events = await getMyEvents();
      setMemberships(events);

      const counts: Record<string, number> = {};
      await Promise.all(
        events.map(async (m) => {
          try {
            const detail = await getEvent(m.eventId);
            counts[m.eventId] = detail._count.photos;
          } catch {}
        }),
      );
      setPhotoCounts(counts);
    } finally {
      setFetching(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  const handleLogout = async () => {
    const { logout } = await import("@/api/auth");
    await logout();
    router.replace("/");
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar showCreateEvent showJoinEvent showSettings />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Your Events</h1>
            <p className="mt-1 text-sm text-zinc-500">Welcome, {user.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowJoin(true)}>
              Join Event
            </Button>
            <Button size="sm" onClick={() => setShowCreate(true)}>
              Create Event
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Sign out
            </Button>
          </div>
        </div>

        {fetching ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-zinc-200" />
            ))}
          </div>
        ) : memberships.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-zinc-500">You haven&apos;t joined any events yet.</p>
            <p className="mt-1 text-sm text-zinc-400">
              Create one or ask someone for their event code.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {memberships.map((m) => (
              <EventCard
                key={m.eventId}
                event={m.event!}
                photoCount={photoCounts[m.eventId] ?? 0}
                isOwner={m.role === "OWNER"}
              />
            ))}
          </div>
        )}
      </main>

      <CreateEventDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(eventId) => router.push(`/events/${eventId}`)}
      />
      <JoinEventDialog
        open={showJoin}
        onClose={() => setShowJoin(false)}
        onJoined={(eventId) => router.push(`/events/${eventId}`)}
      />
    </div>
  );
}