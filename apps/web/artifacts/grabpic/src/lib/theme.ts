import React from 'react';

/**
 * Toggles theme using the browser View Transition API to create a circular reveal animation.
 */
export const toggleThemeWithTransition = (
  event: React.MouseEvent,
  currentTheme: string | undefined,
  setTheme: (theme: string) => void
) => {
  const targetTheme = currentTheme === 'dark' ? 'light' : 'dark';
  const doc = document as any;

  // Fallback for browsers that don't support View Transitions
  if (!doc.startViewTransition) {
    setTheme(targetTheme);
    return;
  }

  const x = event.clientX;
  const y = event.clientY;
  
  // Calculate distance to the farthest corner
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  const transition = doc.startViewTransition(() => {
    setTheme(targetTheme);
  });

  // Apply html transition class
  const transitionClass = targetTheme === 'dark' ? 'theme-transition-expand' : 'theme-transition-contract';
  document.documentElement.classList.add(transitionClass);

  transition.ready.then(() => {
    const isExpand = targetTheme === 'dark';
    const clipPath = isExpand
      ? [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`
        ]
      : [
          `circle(${endRadius}px at ${x}px ${y}px)`,
          `circle(0px at ${x}px ${y}px)`
        ];

    document.documentElement.animate(
      {
        clipPath: clipPath,
      },
      {
        duration: 850,
        easing: 'ease-in-out',
        pseudoElement: isExpand ? '::view-transition-new(root)' : '::view-transition-old(root)',
      }
    );
  });

  // Clean up classes when transition is fully completed
  transition.finished.then(() => {
    document.documentElement.classList.remove('theme-transition-expand', 'theme-transition-contract');
  });
};
