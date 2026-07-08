import { useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, ScanLine } from 'lucide-react';
import { haptic } from '../lib/haptic';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

function extractCodeFromScan(text: string): string | null {
  // Try to extract code from a join URL like /join/<code>
  const urlMatch = text.match(/\/join\/([A-Za-z0-9]{6})/);
  if (urlMatch) return urlMatch[1].toUpperCase();

  // If it's a plain 6-char alphanumeric string, use it directly
  const plain = text.trim();
  if (/^[A-Za-z0-9]{6}$/.test(plain)) return plain.toUpperCase();

  return null;
}

export function QRScannerModal({ isOpen, onClose, onScan }: QRScannerModalProps) {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannedRef = useRef(false);
  const containerIdRef = useRef(`qr-scanner-${Date.now()}`);

  useEffect(() => {
    if (!isOpen) {
      scannedRef.current = false;
      setError(null);
      return;
    }

    // Small delay to ensure the DOM element is rendered
    const timeout = setTimeout(() => {
      const container = document.getElementById(containerIdRef.current);
      if (!container) return;

      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        setError('Camera access is not supported in this browser or environment.');
        return;
      }

      navigator.mediaDevices.enumerateDevices()
        .then((devices) => {
          if (!devices) {
            setError('No camera devices found.');
            return;
          }
          
          try {
            const scanner = new Html5QrcodeScanner(
              containerIdRef.current,
              {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                rememberLastUsedCamera: false,
                supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
              },
              /* verbose= */ false
            );

            scannerRef.current = scanner;

            scanner.render(
              (decodedText) => {
                if (scannedRef.current) return;

                const code = extractCodeFromScan(decodedText);
                if (code) {
                  scannedRef.current = true;
                  scanner.clear().catch(() => {});
                  scannerRef.current = null;
                  onScan(code);
                  onClose();
                }
              },
              (errorMessage) => {
                if (errorMessage?.includes('NotAllowedError') || errorMessage?.includes('Permission')) {
                  setError('Camera access denied. Please allow camera access in your browser settings.');
                }
              }
            );
          } catch (err) {
            setError('Failed to start scanner. Please check camera permissions.');
          }
        })
        .catch(() => {
          setError('Camera initialization failed. Please check permissions.');
        });
    }, 100);

    return () => {
      clearTimeout(timeout);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [isOpen, onScan, onClose]);

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {});
      scannerRef.current = null;
    }
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 bg-popover p-6 shadow-none border border-border rounded-[12px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <div className="flex justify-between items-center">
            <Dialog.Title className="text-xl font-sans tracking-tight text-foreground flex items-center gap-2">
              <ScanLine className="h-5 w-5 text-primary" />
              Scan QR Code
            </Dialog.Title>
            <Dialog.Close 
              onClick={() => haptic.light()}
              className="rounded-full p-1.5 hover:bg-muted text-muted-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="mt-2">
            {error ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <ScanLine className="h-8 w-8 text-destructive" />
                </div>
                <p className="text-sm text-destructive text-center">{error}</p>
                <button
                  onClick={() => {
                    haptic.light();
                    handleClose();
                  }}
                  className="bg-secondary text-secondary-foreground border border-secondary-border h-10 px-6 rounded-[8px] font-medium transition-all hover:bg-muted text-sm"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Point your camera at a GrabPic QR code to join an event.
                </p>
                <div
                  id={containerIdRef.current}
                  className="qr-scanner-container rounded-[8px] overflow-hidden"
                />
              </>
            )}
          </div>

          {/* Custom styles to theme the html5-qrcode scanner UI */}
          <style>{`
            .qr-scanner-container {
              --scanner-bg: hsl(var(--background));
              --scanner-fg: hsl(var(--foreground));
              --scanner-border: hsl(var(--border));
              --scanner-primary: hsl(var(--primary));
              --scanner-muted: hsl(var(--muted-foreground));
            }

            .qr-scanner-container img[alt="Info icon"] {
              display: none;
            }

            .qr-scanner-container #html5-qrcode-anchor-scan-type-change {
              color: var(--scanner-primary) !important;
              text-decoration: none !important;
              font-size: 13px !important;
              font-family: var(--app-font-sans) !important;
            }

            .qr-scanner-container video {
              border-radius: 8px;
            }

            .qr-scanner-container #html5-qrcode-button-camera-permission,
            .qr-scanner-container #html5-qrcode-button-camera-start,
            .qr-scanner-container #html5-qrcode-button-camera-stop {
              background-color: var(--scanner-primary) !important;
              color: white !important;
              border: none !important;
              border-radius: 8px !important;
              padding: 8px 16px !important;
              font-size: 13px !important;
              font-family: var(--app-font-sans) !important;
              font-weight: 500 !important;
              cursor: pointer !important;
              transition: opacity 0.15s !important;
            }

            .qr-scanner-container #html5-qrcode-button-camera-permission:hover,
            .qr-scanner-container #html5-qrcode-button-camera-start:hover,
            .qr-scanner-container #html5-qrcode-button-camera-stop:hover {
              opacity: 0.9 !important;
            }

            .qr-scanner-container select {
              background-color: var(--scanner-bg) !important;
              color: var(--scanner-fg) !important;
              border: 1px solid var(--scanner-border) !important;
              border-radius: 8px !important;
              padding: 6px 10px !important;
              font-size: 13px !important;
              font-family: var(--app-font-sans) !important;
            }

            .qr-scanner-container #html5qr-code-full-region {
              border: none !important;
            }

            .qr-scanner-container #html5qr-code-full-region > div {
              font-family: var(--app-font-sans) !important;
              font-size: 13px !important;
              color: var(--scanner-muted) !important;
            }

            .qr-scanner-container #html5-qrcode-button-file-selection {
              display: none !important;
            }
          `}</style>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
