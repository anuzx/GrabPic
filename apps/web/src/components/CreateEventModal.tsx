import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, CheckCircle2, Copy, Check, ArrowRight } from 'lucide-react';
import { useLocation } from 'wouter';
import { useGrabPic } from '../context/useGrabPic';
import { QRCodeSVG } from 'qrcode.react';
import type { MockEvent } from '../context/GrabPicContext';
import { haptic } from '../lib/haptic';

type CreateStep = 'form' | 'success';

export function CreateEventModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [, setLocation] = useLocation();
  const { addEvent } = useGrabPic();
  const [isCreating, setIsCreating] = useState(false);
  const [step, setStep] = useState<CreateStep>('form');
  const [createdEvent, setCreatedEvent] = useState<MockEvent | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  const resetState = () => {
    setTimeout(() => {
      setStep('form');
      setCreatedEvent(null);
      setTitle('');
      setDescription('');
      setIsCreating(false);
      setCodeCopied(false);
    }, 300);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    haptic.light();
    setIsCreating(true);
    
    try {
      const event = await addEvent(title, description);
      setCreatedEvent(event);
      setStep('success');
      haptic.success();
    } catch (err) {
      console.error(err);
      haptic.warning();
    } finally {
      setIsCreating(false);
    }
  };

  const handleGoToEvent = () => {
    haptic.light();
    if (createdEvent) {
      setLocation(`/events/${createdEvent.id}`);
    }
    onClose();
    resetState();
  };

  const handleCopyCode = async () => {
    if (!createdEvent) return;
    haptic.success();
    try {
      await navigator.clipboard.writeText(createdEvent.code);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = createdEvent.code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      resetState();
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 bg-popover p-6 shadow-none border border-border rounded-[12px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          {step === 'form' && (
            <>
              <div className="flex justify-between items-center">
                <Dialog.Title className="text-xl font-sans tracking-tight text-foreground">Create Event</Dialog.Title>
                <Dialog.Close 
                  onClick={() => haptic.light()}
                  className="rounded-full p-1.5 hover:bg-muted text-muted-foreground transition-colors" 
                  aria-label="Close dialog"
                >
                  <X className="h-4 w-4" />
                </Dialog.Close>
              </div>
              
              <form onSubmit={handleCreate} className="flex flex-col gap-5 mt-2">
                <div className="flex flex-col gap-2">
                  <label htmlFor="title" className="text-[10px] font-semibold uppercase tracking-[0.06em] text-foreground">Event Title</label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Maya's Wedding"
                    className="w-full bg-background border border-input rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-ring transition-colors"
                    data-testid="input-event-title"
                    autoFocus
                    required
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <label htmlFor="description" className="text-[10px] font-semibold uppercase tracking-[0.06em] text-foreground">Description <span className="text-muted-foreground font-normal normal-case">(Optional)</span></label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Any details to share?"
                    className="w-full bg-background border border-input rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-ring transition-colors min-h-[80px] resize-none"
                    data-testid="input-event-description"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isCreating || !title.trim()}
                  className="group relative overflow-hidden bg-primary text-primary-foreground h-10 px-4 rounded-[8px] font-medium transition-all duration-300 hover:opacity-95 hover:ring-2 hover:ring-primary hover:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 mt-2"
                  data-testid="button-submit-create"
                >
                  <span className="absolute right-0 -mt-12 h-32 w-8 translate-x-12 rotate-12 bg-white opacity-20 transition-all duration-1000 ease-out group-hover:-translate-x-[30rem] pointer-events-none" />
                  {isCreating ? 'Creating...' : 'Create Event'}
                </button>
              </form>
            </>
          )}

          {step === 'success' && createdEvent && (
            <>
              <div className="flex justify-end">
                <Dialog.Close 
                  onClick={() => haptic.light()}
                  className="rounded-full p-1.5 hover:bg-muted text-muted-foreground transition-colors" 
                  aria-label="Close success dialog"
                >
                  <X className="h-4 w-4" />
                </Dialog.Close>
              </div>

              {/* Hidden title for accessibility */}
              <Dialog.Title className="sr-only">Event Created</Dialog.Title>

              <div className="flex flex-col items-center gap-5 -mt-2">
                {/* Success icon */}
                <CheckCircle2 className="h-12 w-12 text-[hsl(var(--success))]" />
                
                <h3 className="text-xl font-sans tracking-tight text-foreground">
                  Event Created!
                </h3>

                {/* QR Code */}
                <div className="bg-white p-4 rounded-[12px] border border-border">
                  <QRCodeSVG
                    value={`${window.location.origin}/join/${createdEvent.code}`}
                    size={180}
                    level="H"
                    includeMargin={false}
                    bgColor="#ffffff"
                    fgColor="#1a1916"
                  />
                </div>

                {/* Event code with copy */}
                <div className="flex items-center gap-3">
                  <span className="font-mono text-2xl tracking-[0.2em] text-foreground font-semibold">
                    {createdEvent.code}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="rounded-full p-2 hover:bg-muted text-muted-foreground transition-colors"
                    title="Copy code"
                    aria-label="Copy event code"
                  >
                    {codeCopied ? (
                      <Check className="h-4 w-4 text-[hsl(var(--success))]" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Go to Event button */}
                <button
                  onClick={handleGoToEvent}
                  className="bg-primary text-primary-foreground h-10 px-6 rounded-[8px] font-medium transition-opacity hover:opacity-90 flex items-center justify-center gap-2 w-full"
                  data-testid="button-go-to-event"
                >
                  Go to Event
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
