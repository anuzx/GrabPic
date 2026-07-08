import React, { useRef, useEffect, useState } from 'react';
import { Copy, Image, Key, Calendar, Check } from 'lucide-react';
import gsap from 'gsap';
import { HugeiconsIcon } from '@hugeicons/react';
import { haptic } from '../lib/haptic';
import {
  WeddingIcon,
  SourceCodeIcon,
  WorkoutRunIcon,
  CakeIcon,
  Briefcase01Icon,
  HandshakeIcon,
  GraduationCapIcon,
  MusicNote01Icon,
  ChefHatIcon,
  PaintBrush01Icon,
  CharityIcon,
  Yoga01Icon,
  MountainIcon,
  ChurchIcon,
  GlobalIcon,
  Camera01Icon
} from '@hugeicons/core-free-icons';

import { MockEvent } from '../context/GrabPicContext';

interface EventCardProps {
  event: MockEvent;
  onClick: () => void;
}

const keywordMap = [
  {
    category: 'Wedding',
    keywords: ['wedding', 'engagement', 'bridal', 'marry', 'marriage'],
    icon: WeddingIcon,
  },
  {
    category: 'Tech / Hackathon',
    keywords: ['hackathon', 'coding', 'code', 'product launch', 'startup', 'demo day', 'developer', 'programming', 'tech'],
    icon: SourceCodeIcon,
  },
  {
    category: 'Sports / Fitness',
    keywords: ['match', 'tournament', 'marathon', 'race', 'gym', 'run', 'fitness', 'sports', 'workout'],
    icon: WorkoutRunIcon,
  },
  {
    category: 'Party / Celebration',
    keywords: ['birthday', 'party', 'celebration', 'anniversary', 'reunion', 'fest', 'gala', 'bash', 'gather', 'balloon', 'cake'],
    icon: CakeIcon,
  },
  {
    category: 'Business / Corporate',
    keywords: ['meeting', 'conference', 'seminar', 'corporate', 'summit', 'expo', 'offsite', 'boardroom', 'business'],
    icon: Briefcase01Icon,
  },
  {
    category: 'Networking',
    keywords: ['networking', 'meetup', 'mixer', 'social', 'gathering', 'meet'],
    icon: HandshakeIcon,
  },
  {
    category: 'Education / Training',
    keywords: ['webinar', 'class', 'lecture', 'training', 'course', 'workshop', 'learn', 'study', 'school'],
    icon: GraduationCapIcon,
  },
  {
    category: 'Music / Concert',
    keywords: ['concert', 'music', 'festival', 'gig', 'live show', 'dj', 'band', 'singer', 'show'],
    icon: MusicNote01Icon,
  },
  {
    category: 'Food & Drink',
    keywords: ['food', 'dinner', 'tasting', 'brunch', 'wine', 'cocktail', 'lunch', 'breakfast', 'eat', 'restaurant', 'cafe', 'bar'],
    icon: ChefHatIcon,
  },
  {
    category: 'Arts & Culture',
    keywords: ['art', 'exhibition', 'museum', 'gallery', 'theatre', 'film', 'movie', 'design', 'painting', 'photo', 'photography'],
    icon: PaintBrush01Icon,
  },
  {
    category: 'Charity / Community',
    keywords: ['charity', 'fundraiser', 'volunteer', 'donation', 'ngo', 'nonprofit', 'cause', 'help'],
    icon: CharityIcon,
  },
  {
    category: 'Health & Wellness',
    keywords: ['yoga', 'meditation', 'wellness', 'retreat', 'spa', 'health', 'therapy'],
    icon: Yoga01Icon,
  },
  {
    category: 'Travel / Outdoor',
    keywords: ['trip', 'tour', 'camping', 'hiking', 'adventure', 'travel', 'vacation', 'explore', 'mountain', 'nature', 'tent'],
    icon: MountainIcon,
  },
  {
    category: 'Religious / Spiritual',
    keywords: ['prayer', 'worship', 'spiritual', 'church', 'temple', 'mosque', 'synagogue'],
    icon: ChurchIcon,
  },
  {
    category: 'Online / Virtual',
    keywords: ['virtual', 'online', 'livestream', 'zoom', 'teams', 'stream'],
    icon: GlobalIcon,
  },
];

const getIconForEvent = (title: string, description?: string | null) => {
  const text = `${title} ${description || ''}`.toLowerCase();
  for (const item of keywordMap) {
    if (item.keywords.some(keyword => text.includes(keyword))) {
      return item.icon;
    }
  }
  return Camera01Icon;
};

export function EventCard({ event, onClick }: EventCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLSpanElement>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.success();
    navigator.clipboard.writeText(event.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    haptic.medium();
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouch) {
      setTimeout(() => {
        onClick();
      }, 180);
    } else {
      onClick();
    }
  };

  useEffect(() => {
    const card = cardRef.current;
    const emoji = emojiRef.current;
    if (!card || !emoji) return;

    const handleMouseEnter = () => {
      gsap.to(card, {
        y: -6,
        boxShadow: '0 12px 30px rgba(0,0,0,0.06)',
        duration: 0.3,
        ease: 'power2.out',
      });
      gsap.to(emoji, {
        scale: 1.15,
        duration: 0.3,
        ease: 'back.out(2)',
      });
    };

    const handleMouseLeave = () => {
      gsap.to(card, {
        y: 0,
        boxShadow: 'none',
        duration: 0.4,
        ease: 'power2.inOut',
      });
      gsap.to(emoji, {
        scale: 1,
        duration: 0.3,
        ease: 'power2.out',
      });
    };

    const handleTouchStart = () => {
      gsap.to(card, {
        y: -6,
        boxShadow: '0 12px 30px rgba(0,0,0,0.06)',
        duration: 0.25,
        ease: 'power2.out',
      });
      gsap.to(emoji, {
        scale: 1.15,
        duration: 0.25,
        ease: 'back.out(2)',
      });
    };

    const handleTouchEnd = () => {
      gsap.to(card, {
        y: 0,
        boxShadow: 'none',
        duration: 0.35,
        ease: 'power2.inOut',
      });
      gsap.to(emoji, {
        scale: 1,
        duration: 0.3,
        ease: 'power2.out',
      });
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
      gsap.killTweensOf(emoji);
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className="p-5 bg-card border border-card-border rounded-[16px] overflow-hidden flex flex-col justify-start items-start gap-4 w-full shadow-sm transition-all duration-300 cursor-pointer no-default-hover-elevate"
      onClick={handleCardClick}
      data-testid={`card-event-${event.id}`}
    >
      {/* Info Container */}
      <div className="flex flex-col justify-start items-start gap-3 w-full">
        {/* Title and Tier/Role Badge */}
        <div className="flex justify-between items-center w-full gap-4">
          <div className="flex items-center gap-2.5 overflow-hidden flex-1">
            <span
              ref={emojiRef}
              className="w-8 h-8 shrink-0 bg-muted border border-border rounded-full flex items-center justify-center text-foreground"
            >
              <HugeiconsIcon
                icon={getIconForEvent(event.title, event.description)}
                size={16}
                className="text-foreground"
              />
            </span>
            <h3 className="font-sans font-medium text-foreground text-lg line-clamp-1 tracking-tight">
              {event.title}
            </h3>
          </div>
          <span className={`font-mono text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${
            event.role === 'OWNER'
              ? 'text-primary bg-primary/10 border border-primary/20'
              : 'text-muted-foreground bg-muted border border-border'
          }`}>
            {event.role === 'OWNER' ? 'OWNER' : 'MEM'}
          </span>
        </div>

        {/* Description */}
        <p className="text-muted-foreground text-sm font-sans line-clamp-2 w-full min-h-[40px] leading-relaxed">
          {event.description || 'Please add your content here. Keep it short and simple. And smile :)'}
        </p>

        {/* Metadata Badges */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1 pt-3 border-t border-border w-full">
          {/* Photo Count */}
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-muted border border-border rounded-full flex items-center justify-center text-muted-foreground">
              <Image className="w-2.5 h-2.5" />
            </div>
            <span className="text-xs text-muted-foreground font-mono">{event.photoCount} photos</span>
          </div>


          {/* Event Join Code */}
          <div
            className="flex items-center gap-1.5 group/code cursor-pointer"
            onClick={handleCopy}
            title="Click to copy code"
          >
            <div className="w-4 h-4 bg-muted border border-border rounded-full flex items-center justify-center text-muted-foreground group-hover/code:bg-primary/10 group-hover/code:text-primary transition-colors">
              {copied ? <Check className="w-2.5 h-2.5 text-success animate-in fade-in zoom-in duration-200" /> : <Key className="w-2.5 h-2.5" />}
            </div>
            <span className="text-xs text-muted-foreground font-mono group-hover/code:text-foreground transition-colors">
              {event.code}
            </span>
            {!copied && <Copy className="w-3 h-3 text-muted-foreground/40 opacity-0 group-hover/code:opacity-100 transition-opacity ml-0.5 md:block hidden" />}
          </div>

          {/* Event Creation Date */}
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-muted border border-border rounded-full flex items-center justify-center text-muted-foreground">
              <Calendar className="w-2.5 h-2.5" />
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {new Date(event.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
