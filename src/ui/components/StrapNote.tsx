import { useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { NARROW, useMedia } from '../useMedia';

/** Pixels per second the ticker moves — a readable news-ticker pace. */
const SPEED = 45;

/**
 * The strap's one-line note ("Nothing urgent on the board…"). On desktop it
 * is exactly the plain span it always was. On a phone, when the line does
 * not fit, it scrolls right-to-left like a news ticker instead of being cut
 * off with "…" (owner request, 2026-09-24): two copies of the text slide by
 * one copy's width and loop seamlessly. It only scrolls when it overflows,
 * and never with "reduce motion" on (the CSS wraps it to two lines instead).
 */
export function StrapNote({ text }: { text: string }) {
  const narrow = useMedia(NARROW);
  const reduce = useMedia('(prefers-reduced-motion: reduce)');
  const box = useRef<HTMLSpanElement>(null);
  const first = useRef<HTMLSpanElement>(null);
  // null = fits (no ticker); otherwise the loop's duration in seconds
  const [loop, setLoop] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (!narrow || reduce) { setLoop(null); return; }
    const el = box.current;
    const copy = first.current;
    if (!el || !copy) return;
    const measure = () => {
      // (an inline span has no scrollWidth; its box width is the text's)
      const pad = parseFloat(getComputedStyle(copy).paddingRight) || 0;
      const width = copy.getBoundingClientRect().width;
      const fits = el.clientWidth === 0 || width - pad <= el.clientWidth;
      // one copy plus its 48px gap is the distance travelled per loop
      setLoop(fits ? null : Math.max(6, (width - pad + 48) / SPEED));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [narrow, reduce, text]);

  if (!narrow) return <span className="sp">{text}</span>;
  return (
    <span
      ref={box}
      className={loop ? 'sp ticker' : 'sp'}
      style={loop ? ({ '--sp-dur': `${loop.toFixed(1)}s` } as CSSProperties) : undefined}
    >
      <span className="sp-track">
        <span ref={first} className="sp-text">{text}</span>
        {loop && <span className="sp-text" aria-hidden="true">{text}</span>}
      </span>
    </span>
  );
}
