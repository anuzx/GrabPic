import { useState, useRef, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Copy, Download, Check, QrCode } from 'lucide-react';
import { haptic } from '../lib/haptic';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: { title: string; code: string };
}

export function QRCodeModal({ isOpen, onClose, event }: QRCodeModalProps) {
  const [copied, setCopied] = useState(false);
  const qrContainerRef = useRef<HTMLDivElement>(null);

  const joinUrl = `${window.location.origin}/join/${event.code}`;

  const handleCopyLink = useCallback(async () => {
    haptic.success();
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = joinUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [joinUrl]);

  const handleDownloadQR = useCallback(() => {
    haptic.light();
    const container = qrContainerRef.current;
    if (!container) return;

    const svgElement = container.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = 3; // High-res output
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${event.title.replace(/\s+/g, '_')}_QR.png`;
      link.href = pngUrl;
      link.click();

      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, [event.title]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-sm translate-x-[-50%] translate-y-[-50%] gap-4 bg-popover p-6 shadow-none border border-border rounded-[12px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <div className="flex justify-between items-center">
            <Dialog.Title className="text-xl font-sans tracking-tight text-foreground flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              Share Event
            </Dialog.Title>
            <Dialog.Close 
              onClick={() => haptic.light()}
              className="rounded-full p-1.5 hover:bg-muted text-muted-foreground transition-colors" 
              aria-label="Close share dialog"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="flex flex-col items-center gap-5 mt-2">
            {/* QR Code */}
            <div
              ref={qrContainerRef}
              className="bg-white p-5 rounded-[12px] border border-border"
            >
              <QRCodeSVG
                value={joinUrl}
                size={200}
                level="H"
                includeMargin={false}
                bgColor="#ffffff"
                fgColor="#1a1916"
              />
            </div>

            {/* Event info */}
            <div className="text-center flex flex-col gap-1.5">
              <h3 className="text-base font-medium text-foreground">{event.title}</h3>
              <p className="font-mono text-2xl tracking-[0.2em] text-foreground font-semibold">
                {event.code}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 w-full">
              <button
                onClick={handleCopyLink}
                className="flex-1 bg-secondary text-secondary-foreground border border-secondary-border h-10 px-4 rounded-[8px] font-medium transition-all hover:bg-muted flex items-center justify-center gap-2 text-sm"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-[hsl(var(--success))]" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Link
                  </>
                )}
              </button>
              <button
                onClick={handleDownloadQR}
                className="flex-1 bg-primary text-primary-foreground h-10 px-4 rounded-[8px] font-medium transition-opacity hover:opacity-90 flex items-center justify-center gap-2 text-sm"
              >
                <Download className="h-4 w-4" />
                Download QR
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
