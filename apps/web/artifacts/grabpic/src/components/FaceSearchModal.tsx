import React, { useState, useRef, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Camera, Loader2, CheckCircle2 } from 'lucide-react';
import { haptic } from '../lib/haptic';
import { motion, AnimatePresence } from 'framer-motion';

type SearchStep = 'select' | 'searching' | 'done';

interface FaceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearchComplete: (matchedPhotoIds: string[]) => void;
  eventId: string;
}

export function FaceSearchModal({ isOpen, onClose, onSearchComplete, eventId }: FaceSearchModalProps) {
  const [step, setStep] = useState<SearchStep>('select');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep('select');
        setPreviewUrl(null);
        setFile(null);
      }, 300);
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      haptic.light();
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    }
  };

  const handleSearch = () => {
    if (!file) return;
    haptic.medium();
    setStep('searching');
    
    // Fake search delay
    setTimeout(() => {
      haptic.success();
      setStep('done');
      setTimeout(() => {
        // Return some random mock photo indices
        onSearchComplete(['p-0', 'p-4', 'p-7', 'p-12', 'p-18']);
        onClose();
      }, 1500);
    }, 2000);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-sm translate-x-[-50%] translate-y-[-50%] gap-4 bg-popover p-6 shadow-none border border-border rounded-[12px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <div className="flex justify-between items-center">
            <Dialog.Title className="text-xl font-sans tracking-tight text-foreground">Find My Photos</Dialog.Title>
            <Dialog.Close 
              onClick={() => haptic.light()}
              className="rounded-full p-1.5 hover:bg-muted text-muted-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          
          <div className="mt-4 flex flex-col items-center">
            <AnimatePresence mode="wait">
              {step === 'select' && (
                <motion.div
                  key="select"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full flex flex-col items-center"
                >
                  <p className="text-sm text-body text-center mb-6">
                    Upload a selfie or clear photo of your face. We'll find every photo you appear in.
                  </p>
                  
                  <div 
                    className="w-40 h-40 rounded-full border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-ring transition-colors relative overflow-hidden bg-background mb-6"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {previewUrl ? (
                      <img src={previewUrl} alt="Selfie preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center text-muted-foreground">
                        <Camera className="w-8 h-8 mb-2" />
                        <span className="text-xs font-medium">Add Photo</span>
                      </div>
                    )}
                    <input 
                      type="file" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      capture="user"
                    />
                  </div>
                  
                  <button
                    onClick={handleSearch}
                    disabled={!previewUrl}
                    className="bg-primary text-primary-foreground h-10 px-8 rounded-[8px] font-medium transition-opacity hover:opacity-90 disabled:opacity-50 w-full"
                    data-testid="button-search-face"
                  >
                    Find My Photos
                  </button>
                </motion.div>
              )}

              {step === 'searching' && (
                <motion.div
                  key="searching"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  className="w-full flex flex-col items-center py-10"
                >
                  <div className="relative w-32 h-32 mb-6">
                    {previewUrl && (
                      <img src={previewUrl} alt="Selfie" className="w-full h-full object-cover rounded-full opacity-50" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-1">Scanning event photos...</h3>
                  <p className="text-sm text-muted-foreground animate-pulse">Processing facial embeddings</p>
                </motion.div>
              )}

              {step === 'done' && (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full flex flex-col items-center py-10"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  >
                    <CheckCircle2 className="w-16 h-16 text-success mb-4" />
                  </motion.div>
                  <h3 className="text-xl font-sans tracking-tight text-success mb-2">
                    Search Complete
                  </h3>
                  <p className="text-sm text-body text-center">
                    Found your photos! Highlighting them now.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
