import { useContext } from 'react';
import { GrabPicContext } from './GrabPicContext';

export function useGrabPic() {
  const context = useContext(GrabPicContext);
  if (context === undefined) {
    throw new Error('useGrabPic must be used within a GrabPicProvider');
  }
  return context;
}
