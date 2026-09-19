import { annotateTerms } from '../../game/glossary';

/**
 * Renders card prose: splits on blank lines into paragraphs, and — inside
 * each paragraph — wraps the first occurrence of any glossary term with a
 * plain-language hover/tap definition. See src/game/glossary.ts.
 */
export function Prose({ text, gloss = true }: { text: string; gloss?: boolean }) {
  return (
    <>
      {text.split('\n\n').map((para, i) => (
        <p key={i}>
          {para.split('\n').map((line, j, arr) => (
            <span key={j}>
              {gloss ? <Glossed text={line} /> : line}
              {j < arr.length - 1 && <br />}
            </span>
          ))}
        </p>
      ))}
    </>
  );
}

function Glossed({ text }: { text: string }) {
  const parts = annotateTerms(text);
  if (parts.length === 1 && !parts[0].def) return <>{text}</>;
  return (
    <>
      {parts.map((p, i) =>
        p.def ? (
          <abbr className="term" title={p.def} key={i}>{p.text}</abbr>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  );
}
