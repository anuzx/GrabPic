import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Touchpad, HelpCircle, Check, Eye } from 'lucide-react';
import { haptic, HapticSettings } from '../lib/haptic';

interface HapticSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HapticSettingsModal({ isOpen, onClose }: HapticSettingsModalProps) {
  const [settings, setSettings] = useState<HapticSettings>({
    vibrateEnabled: true,
    visualEnabled: true,
    reduceMotion: false,
  });

  // Load current settings when modal opens
  useEffect(() => {
    if (isOpen) {
      setSettings(haptic.getSettings());
    }
  }, [isOpen]);

  const toggleVibrate = () => {
    haptic.selection();
    const updated = { vibrateEnabled: !settings.vibrateEnabled };
    haptic.updateSettings(updated);
    setSettings(prev => ({ ...prev, ...updated }));
  };

  const toggleVisual = () => {
    haptic.selection();
    const updated = { visualEnabled: !settings.visualEnabled };
    haptic.updateSettings(updated);
    setSettings(prev => ({ ...prev, ...updated }));
  };

  const toggleReduceMotion = () => {
    haptic.selection();
    const updated = { reduceMotion: !settings.reduceMotion };
    haptic.updateSettings(updated);
    setSettings(prev => ({ ...prev, ...updated }));
  };

  const handleTestHaptic = (type: 'light' | 'medium' | 'success' | 'error') => {
    if (type === 'light') haptic.light();
    else if (type === 'medium') haptic.medium();
    else if (type === 'success') haptic.success();
    else if (type === 'error') haptic.error();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 bg-popover p-6 shadow-none border border-border rounded-[12px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <div className="flex justify-between items-center">
            <Dialog.Title className="text-xl font-sans tracking-tight text-foreground flex items-center gap-2">
              <Touchpad className="w-5 h-5 text-[#ff5722]" />
              Tactile Settings
            </Dialog.Title>
            <Dialog.Close 
              onClick={() => haptic.light()}
              className="rounded-full p-1.5 hover:bg-muted text-muted-foreground transition-colors" 
              aria-label="Close settings dialog"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="mt-4 flex flex-col gap-6">
            {/* Setting 1: Vibrate Feedback */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex flex-col gap-1 pr-4">
                <span className="text-sm font-semibold text-foreground">Tactile Feedback</span>
                <span className="text-xs text-muted-foreground leading-normal">
                  Vibrate on interactive actions (supported mobile browsers).
                </span>
              </div>
              <button
                onClick={toggleVibrate}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                  settings.vibrateEnabled ? 'bg-primary' : 'bg-muted'
                }`}
                aria-checked={settings.vibrateEnabled}
                role="switch"
                aria-label="Enable tactile feedback"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.vibrateEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Setting 2: Visual Feedback */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex flex-col gap-1 pr-4">
                <span className="text-sm font-semibold text-foreground">Visual Effects</span>
                <span className="text-xs text-muted-foreground leading-normal">
                  Tactile-equivalent visual animations (scaling, shakes, ripples).
                </span>
              </div>
              <button
                onClick={toggleVisual}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                  settings.visualEnabled ? 'bg-primary' : 'bg-muted'
                }`}
                aria-checked={settings.visualEnabled}
                role="switch"
                aria-label="Enable interaction animations"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.visualEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Setting 3: Reduced Motion */}
            <div className="flex items-center justify-between pb-4">
              <div className="flex flex-col gap-1 pr-4">
                <span className="text-sm font-semibold text-foreground">Reduce Motion</span>
                <span className="text-xs text-muted-foreground leading-normal">
                  Minimize movement, scaling, and transitions inside layout cards.
                </span>
              </div>
              <button
                onClick={toggleReduceMotion}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                  settings.reduceMotion ? 'bg-primary' : 'bg-muted'
                }`}
                aria-checked={settings.reduceMotion}
                role="switch"
                aria-label="Reduce motion"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.reduceMotion ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Try Out/Testing Haptic triggers */}
            {settings.vibrateEnabled && (
              <div className="bg-muted/50 rounded-lg p-4 border border-border/60">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground block mb-3">
                  Test Vibration Patterns
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleTestHaptic('light')}
                    className="h-9 rounded-md bg-card border border-border text-xs font-medium hover:bg-muted text-foreground flex items-center justify-center transition-colors"
                  >
                    Light
                  </button>
                  <button
                    onClick={() => handleTestHaptic('medium')}
                    className="h-9 rounded-md bg-card border border-border text-xs font-medium hover:bg-muted text-foreground flex items-center justify-center transition-colors"
                  >
                    Medium
                  </button>
                  <button
                    onClick={() => handleTestHaptic('success')}
                    className="h-9 rounded-md bg-card border border-border text-xs font-medium hover:bg-muted text-success flex items-center justify-center transition-colors"
                  >
                    Success
                  </button>
                  <button
                    onClick={() => handleTestHaptic('error')}
                    className="h-9 rounded-md bg-card border border-border text-xs font-medium hover:bg-muted text-destructive flex items-center justify-center transition-colors"
                  >
                    Error
                  </button>
                </div>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export default HapticSettingsModal;
