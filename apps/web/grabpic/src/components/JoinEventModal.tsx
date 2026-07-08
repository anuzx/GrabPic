import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, ScanLine } from 'lucide-react';
import { useLocation } from 'wouter';
import { useGrabPic } from '../context/useGrabPic';
import { QRScannerModal } from './QRScannerModal';
import { haptic } from '../lib/haptic';

export function JoinEventModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [, setLocation] = useLocation();
  const { joinEvent } = useGrabPic();
  const [isJoining, setIsJoining] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [shake, setShake] = useState(false);

  const triggerError = (msg: string) => {
    setError(msg);
    haptic.error();
    setShake(true);
    setTimeout(() => setShake(false), 300);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      triggerError('Code must be 6 characters');
      return;
    }
    
    setError('');
    setIsJoining(true);
    
    setTimeout(() => {
      const event = joinEvent(code);
      setIsJoining(false);
      
      if (event) {
        haptic.success();
        onClose();
        setLocation(`/events/${event.id}`);
        setCode('');
      } else {
        triggerError('Event not found. Check the code and try again.');
      }
    }, 600);
  };

  const handleScanResult = (scannedCode: string) => {
    haptic.success();
    setCode(scannedCode.toUpperCase());
    setIsScannerOpen(false);
    setError('');
  };

  return (
    <>
      <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className={`fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 bg-popover p-6 shadow-none border border-border rounded-[12px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] ${shake ? 'animate-haptic-shake' : ''}`}>
            <div className="flex justify-between items-center">
              <Dialog.Title className="text-xl font-sans tracking-tight text-foreground">Join Event</Dialog.Title>
              <Dialog.Close 
                onClick={() => haptic.light()}
                className="rounded-full p-1.5 hover:bg-muted text-muted-foreground transition-colors" 
                aria-label="Close join event dialog"
              >
                <X className="h-4 w-4" />
              </Dialog.Close>
            </div>
            
            <form onSubmit={handleJoin} className="flex flex-col gap-6 mt-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="code" className="text-sm font-semibold uppercase tracking-[0.06em] text-foreground">Event Code</label>
                <input
                  id="code"
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setError('');
                  }}
                  placeholder="A1B2C3"
                  className="w-full bg-background border border-input rounded-[8px] px-4 py-3 font-mono text-center text-2xl tracking-[0.2em] focus:outline-none focus:border-ring transition-colors uppercase"
                  data-testid="input-join-code"
                  autoFocus
                />
                {error && <span className="text-sm text-destructive mt-1">{error}</span>}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground font-medium">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Scan QR Code button */}
              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  setIsScannerOpen(true);
                }}
                className="bg-secondary text-secondary-foreground border border-secondary-border h-10 px-4 rounded-[8px] font-medium transition-all hover:bg-muted flex items-center justify-center gap-2 w-full"
                data-testid="button-scan-qr"
              >
                <ScanLine className="h-4 w-4" />
                Scan QR Code
              </button>
              
              <button
                type="submit"
                disabled={isJoining || code.length !== 6}
                className="bg-primary text-primary-foreground h-10 px-4 rounded-[8px] font-medium transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                data-testid="button-submit-join"
              >
                {isJoining ? 'Joining...' : 'Join Event'}
              </button>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScanResult}
      />
    </>
  );
}
