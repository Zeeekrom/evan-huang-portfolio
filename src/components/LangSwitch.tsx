/**
 * The language switch, in both bars.
 *
 * The side you are on is plain text and the other side is the link, which is
 * the one arrangement that cannot be misread: a switch where both halves are
 * links makes the reader guess which one they are already looking at.
 *
 * `hrefLang` and the `lang` on each label are not decoration — they are what
 * tells a crawler and a screen reader that the word "中文" is Chinese sitting
 * inside an English document, and which document it leads to.
 *
 * A plain anchor rather than next/link, deliberately. In a static export the
 * client runtime asks for a nested route's payload at `__next.zh.__PAGE__.txt`
 * while the export writes it to `__next.zh/__PAGE__.txt`, so every prefetch
 * logs a 404 and the navigation falls back to a full load anyway. A full load
 * is also the better behaviour here: these two pages share nothing but a
 * cached stylesheet, and arriving the ordinary way means the document is in
 * the right language from the first frame instead of after a swap.
 */
export default function LangSwitch({ here }: { here: "en" | "zh" }) {
  const en = (
    <span lang="en">EN</span>
  );
  const cn = (
    /* The language's name in its own script, which is not a translatable string. */
    <span lang="zh-Hans">中文</span>
  );

  return (
    <span className="langsw">
      {here === "en" ? (
        <>
          <b aria-current="true">{en}</b>
          <i>·</i>
          <a href="/zh/" hrefLang="zh-Hans">
            {cn}
          </a>
        </>
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" hrefLang="en">
            {en}
          </a>
          <i>·</i>
          <b aria-current="true">{cn}</b>
        </>
      )}
    </span>
  );
}
