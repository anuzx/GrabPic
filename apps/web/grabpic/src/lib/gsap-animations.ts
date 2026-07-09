import gsap from 'gsap';

/**
 * Fade in from below with opacity transition.
 */
export function createFadeInUp(
  element: gsap.TweenTarget,
  delay = 0,
  duration = 0.7
): gsap.core.Tween {
  return gsap.from(element, {
    y: 40,
    opacity: 0,
    duration,
    delay,
    ease: 'power3.out',
  });
}

/**
 * Stagger reveal children elements from below.
 */
export function createStaggerReveal(
  elements: gsap.TweenTarget,
  stagger = 0.08,
  delay = 0
): gsap.core.Tween {
  return gsap.from(elements, {
    y: 30,
    opacity: 0,
    stagger,
    delay,
    duration: 0.6,
    ease: 'power3.out',
  });
}

/**
 * Scale in from smaller size with opacity.
 */
export function createScaleIn(
  element: gsap.TweenTarget,
  delay = 0
): gsap.core.Tween {
  return gsap.from(element, {
    scale: 0.85,
    opacity: 0,
    duration: 0.5,
    delay,
    ease: 'back.out(2)',
  });
}

/**
 * Slide in from the left.
 */
export function createSlideFromLeft(
  element: gsap.TweenTarget,
  delay = 0
): gsap.core.Tween {
  return gsap.from(element, {
    x: -60,
    opacity: 0,
    duration: 0.6,
    delay,
    ease: 'power3.out',
  });
}

/**
 * Slide in from the right.
 */
export function createSlideFromRight(
  element: gsap.TweenTarget,
  delay = 0
): gsap.core.Tween {
  return gsap.from(element, {
    x: 60,
    opacity: 0,
    duration: 0.6,
    delay,
    ease: 'power3.out',
  });
}

/**
 * Animate a number counting up from 0 to endValue.
 * Updates the element's textContent.
 */
export function createCountUp(
  element: HTMLElement,
  endValue: number,
  duration = 1
): gsap.core.Tween {
  const obj = { val: 0 };
  return gsap.to(obj, {
    val: endValue,
    duration,
    ease: 'power2.out',
    snap: { val: 1 },
    onUpdate: () => {
      element.textContent = String(Math.round(obj.val));
    },
  });
}

/**
 * Creates a magnetic hover effect on an element.
 * The element subtly follows the mouse cursor within its bounds.
 * Returns cleanup function.
 */
export function createMagneticHover(
  element: HTMLElement,
  strength = 0.1
): () => void {
  const xTo = gsap.quickTo(element, 'x', { duration: 0.4, ease: 'power2.out' });
  const yTo = gsap.quickTo(element, 'y', { duration: 0.4, ease: 'power2.out' });

  const handleMove = (e: MouseEvent) => {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = (e.clientX - centerX) * strength;
    const deltaY = (e.clientY - centerY) * strength;
    xTo(deltaX);
    yTo(deltaY);
  };

  const handleLeave = () => {
    gsap.to(element, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: 'elastic.out(1, 0.3)',
    });
  };

  element.addEventListener('mousemove', handleMove);
  element.addEventListener('mouseleave', handleLeave);

  return () => {
    element.removeEventListener('mousemove', handleMove);
    element.removeEventListener('mouseleave', handleLeave);
    gsap.set(element, { x: 0, y: 0 });
  };
}

/**
 * Creates a hover lift effect with shadow bloom.
 */
export function createHoverLift(
  element: HTMLElement,
  liftY = -4
): () => void {
  const handleEnter = () => {
    gsap.to(element, {
      y: liftY,
      boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
      duration: 0.3,
      ease: 'power2.out',
    });
  };

  const handleLeave = () => {
    gsap.to(element, {
      y: 0,
      boxShadow: 'none',
      duration: 0.4,
      ease: 'power2.inOut',
    });
  };

  element.addEventListener('mouseenter', handleEnter);
  element.addEventListener('mouseleave', handleLeave);

  return () => {
    element.removeEventListener('mouseenter', handleEnter);
    element.removeEventListener('mouseleave', handleLeave);
    gsap.set(element, { y: 0, boxShadow: 'none' });
  };
}

/**
 * Creates a glitch text effect.
 * Rapidly offsets text position and adds chromatic aberration textShadow.
 */
export function createGlitchEffect(
  element: HTMLElement,
  duration = 0.8
): gsap.core.Timeline {
  const tl = gsap.timeline();

  // Rapid glitch frames
  const glitchFrames = [
    { x: -3, textShadow: '2px 0 #ff0000, -2px 0 #00ffff' },
    { x: 3, textShadow: '-2px 0 #ff0000, 2px 0 #00ffff' },
    { x: -1, textShadow: '1px 0 #ff0000, -1px 0 #00ffff' },
    { x: 2, textShadow: '-1px 0 #ff0000, 1px 0 #00ffff' },
    { x: -2, textShadow: '3px 0 #ff0000, -3px 0 #00ffff' },
    { x: 0, textShadow: 'none' },
  ];

  const frameDuration = duration / glitchFrames.length;
  glitchFrames.forEach((frame) => {
    tl.to(element, {
      ...frame,
      opacity: frame.x !== 0 ? 0.85 : 1,
      duration: frameDuration,
      ease: 'none',
    });
  });

  return tl;
}
