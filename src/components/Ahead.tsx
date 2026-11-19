import type { CSSProperties } from "react";
import { bundle, type Lang } from "@/data/content";
import type { AheadWord } from "@/data/content";

/**
 * Where I'm Heading — the forward-looking half of the page.
 *
 * Everything above this section is evidence: things built, roles held,
 * numbers a reader can check. This one is the opposite, and the section has
 * to say so on its face, which is what `note` is for. A portfolio that lets
 * ambition sit in the same visual register as experience is making a claim
 * it has not earned.
 *
 * Each block is a word cloud rather than a list because the point is the
 * shape of an interest, not a ranking.
 *
 * The first version placed every word on a ring by angle, which looked right
 * on paper and collided on screen: polar coordinates know nothing about how
 * wide "Business Solution Developer" is, so the long words sat on top of one
 * another and the outer ring spilled past the circle. This lays them out in
 * ordinary centred flow instead and orders them so the heaviest land in the
 * middle rows — a cloud that cannot overlap, because nothing is positioned.
 */

/* Heaviest in the middle, lightest at the top and bottom edges. */
function arrange(words: AheadWord[]): AheadWord[] {
  const tier = (w: number) => words.filter((word) => word.weight === w);
  const [light, mid, heavy] = [tier(1), tier(2), tier(3)];
  const half = (list: AheadWord[]) => {
    const cut = Math.ceil(list.length / 2);
    return [list.slice(0, cut), list.slice(cut)] as const;
  };
  const [lightTop, lightEnd] = half(light);
  const [midTop, midEnd] = half(mid);
  return [...lightTop, ...midTop, ...heavy, ...midEnd, ...lightEnd];
}

const SIZE: Record<number, string> = {
  3: "clamp(1.1rem, 2.6vw, 1.7rem)",
  2: "clamp(0.86rem, 1.7vw, 1.08rem)",
  1: "clamp(0.66rem, 1.25vw, 0.78rem)",
};

/* The accent hues the rest of the page already uses, walked in order. */
const HUES = ["--c1-text", "--c4-text", "--c5-text", "--c3-text", "--c2-text", "--c6-text"];

export default function Ahead({ lang = "en" }: { lang?: Lang }) {
  const { ahead } = bundle(lang);

  return (
    <section id="ahead" className="sec pad">
      <div className="sec-h">
        <h2>{ahead.heading}</h2>
        <span className="aside">{ahead.aside}</span>
      </div>

      <p className="scope mt-5">{ahead.note}</p>

      <div className="ahead-grid mt-9">
        {ahead.blocks.map((block) => (
          <div className="ahead-block" key={block.heading}>
            <h3>{block.heading}</h3>
            <p className="ahead-line">{block.line}</p>

            <div className="ahead-cloud">
              {arrange(block.words).map((word, i) => (
                <span
                  key={word.text}
                  className={`ahead-word w${word.weight}`}
                  style={
                    {
                      fontSize: SIZE[word.weight] ?? SIZE[1],
                      color: `var(${HUES[i % HUES.length]})`,
                    } as CSSProperties
                  }
                >
                  {word.text}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
