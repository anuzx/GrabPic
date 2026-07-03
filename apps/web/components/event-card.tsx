import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import type { EventData } from "@/api/events";

interface EventCardProps {
  event: EventData;
  photoCount: number;
  isOwner: boolean;
}

export function EventCard({ event, photoCount, isOwner }: EventCardProps) {
  return (
    <Link href={`/events/${event.id}`}>
      <Card className="w-full transition-shadow hover:shadow-md cursor-pointer">
        <CardContent className="flex items-center justify-between p-5">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-zinc-900 truncate">{event.title}</h3>
            {event.description && (
              <p className="mt-0.5 text-sm text-zinc-500 truncate">{event.description}</p>
            )}
            <p className="mt-1 text-xs text-zinc-400">
              {photoCount} {photoCount === 1 ? "photo" : "photos"}
              {isOwner && " · You're the owner"}
            </p>
          </div>
          <div className="ml-4 flex items-center gap-3 shrink-0">
            <span className="font-mono text-xs text-zinc-400">{event.code}</span>
            <svg className="h-5 w-5 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}