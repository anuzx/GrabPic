"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  showCreateEvent?: boolean;
  showJoinEvent?: boolean;
  showSettings?: boolean;
  eventCode?: string;
  showUpload?: boolean;
  showScan?: boolean;
  onUploadClick?: () => void;
  onScanClick?: () => void;
}

export function Navbar({
  showCreateEvent,
  showJoinEvent,
  showSettings,
  eventCode,
  showUpload,
  showScan,
  onUploadClick,
  onScanClick,
}: NavbarProps) {
  const { user } = useAuth();
  const isLoggedIn = !!user;

  if (!isLoggedIn) {
    return (
      <nav className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-zinc-200 bg-white/80 px-6 backdrop-blur">
        <Link href="/" className="text-xl font-bold tracking-tight text-zinc-900">
          GrabPic
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/signin">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/signup">
            <Button>Get Started</Button>
          </Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-zinc-200 bg-white/80 px-6 backdrop-blur">
      <div className="flex items-center gap-4">
        {showSettings && (
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Button>
          </Link>
        )}
        <Link href="/" className="text-xl font-bold tracking-tight text-zinc-900">
          GrabPic
        </Link>
      </div>

      {eventCode && (
        <div className="hidden sm:flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm font-mono text-zinc-700">
          <span>{eventCode}</span>
          <button
            onClick={() => navigator.clipboard.writeText(eventCode)}
            className="text-zinc-400 hover:text-zinc-600 transition-colors"
            title="Copy code"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex items-center gap-3">
        {showUpload && (
          <Button onClick={onUploadClick} size="sm">
            Upload Photos
          </Button>
        )}
        {showScan && (
          <Button onClick={onScanClick} variant="outline" size="sm">
            Scan Face
          </Button>
        )}
        {showCreateEvent && (
          <Link href="/dashboard?create=true">
            <Button size="sm">Create Event</Button>
          </Link>
        )}
        {showJoinEvent && (
          <Link href="/dashboard?join=true">
            <Button variant="outline" size="sm">
              Join Event
            </Button>
          </Link>
        )}
      </div>
    </nav>
  );
}