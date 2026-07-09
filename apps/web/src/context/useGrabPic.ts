import { createContext, useContext } from 'react';
import type { GrabPicContextType } from './GrabPicContext';

export const GrabPicContext = createContext<GrabPicContextType | undefined>(undefined);

export function useGrabPic() {
  const context = useContext(GrabPicContext);
  if (context === undefined) {
    throw new Error('useGrabPic must be used within a GrabPicProvider');
  }
  return context;
}
