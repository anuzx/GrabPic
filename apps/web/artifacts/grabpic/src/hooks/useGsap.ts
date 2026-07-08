import { useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register plugins once
gsap.registerPlugin(ScrollTrigger);

/**
 * Custom hook that creates a GSAP context scoped to a ref element.
 * All animations created within the context callback are automatically
 * cleaned up when the component unmounts.
 */
export function useGsapContext(scope?: React.RefObject<HTMLElement | null>) {
  const ctx = useRef<gsap.Context | null>(null);

  useEffect(() => {
    ctx.current = gsap.context(() => {}, scope?.current || undefined);
    return () => {
      ctx.current?.revert();
    };
  }, [scope]);

  const add = useCallback((fn: () => void) => {
    ctx.current?.add(fn);
  }, []);

  return { ctx: ctx.current, add };
}

/**
 * Hook to run a GSAP animation on mount within a scoped context.
 * The animation function receives the scope ref's element.
 * Automatically cleans up on unmount.
 */
export function useGsapEffect(
  ref: React.RefObject<HTMLElement | null>,
  animation: (element: HTMLElement, ctx: gsap.Context) => void,
  deps: any[] = []
) {
  useEffect(() => {
    if (!ref.current) return;
    
    const ctx = gsap.context(() => {
      animation(ref.current!, ctx);
    }, ref.current);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, ...deps]);
}

/**
 * Hook that returns a gsap.quickTo function for smooth mouse-following effects.
 * Useful for magnetic hover, parallax, etc.
 */
export function useGsapQuickTo(
  ref: React.RefObject<HTMLElement | null>,
  prop: string,
  vars?: gsap.TweenVars
) {
  const quickTo = useRef<ReturnType<typeof gsap.quickTo> | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    quickTo.current = gsap.quickTo(ref.current, prop, {
      duration: 0.4,
      ease: 'power2.out',
      ...vars,
    });
  }, [ref, prop, vars]);

  return quickTo;
}

export { gsap, ScrollTrigger };
