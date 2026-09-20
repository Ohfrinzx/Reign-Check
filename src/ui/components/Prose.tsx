/**
 * Renders card prose: splits on blank lines into paragraphs.
 *
 * Institutional/financial jargon used to be glossed inline via a hover-only
 * <abbr title="…">. That's gone — a definition only the mouse can find isn't
 * "everything you need to decide" in front of you. See CardView.tsx's
 * glossary footnote, which lists any term a card actually uses in plain
 * text at the bottom of the card instead.
 */
export function Prose({ text }: { text: string }) {
  return (
    <>
      {text.split('\n\n').map((para, i) => (
        <p key={i}>
          {para.split('\n').map((line, j, arr) => (
            <span key={j}>
              {line}
              {j < arr.length - 1 && <br />}
            </span>
          ))}
        </p>
      ))}
    </>
  );
}

/** Plain text. Kept as its own component so call sites (option hints,
 *  flavor text, threat cards) don't need to change. */
export function Glossed({ text }: { text: string }) {
  return <>{text}</>;
}
