import { useSyncExternalStore } from 'react';

/**
 * True while a CSS media query matches, updating live (rotation, resizing).
 * Used for the few words that differ on a phone, e.g. "on the right" vs "in
 * your Files". Words are swapped as plain text rather than hidden with CSS
 * spans, because an extra span splits the line into separately shaped runs
 * and shifts the desktop text by a sub-pixel (tools/desktop-snap.mjs caught
 * that). Layout itself stays in CSS.
 */
export function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const m = window.matchMedia(query);
      m.addEventListener('change', onChange);
      return () => m.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** The phone/tablet layout (the rail is a drawer) — matches index.css. */
export const NARROW = '(max-width: 1080px)';
/** A touch screen with no hover — keyboard hints are pointless there. */
export const TOUCH = '(hover: none)';
