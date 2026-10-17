import { publications } from "@/data/content";

export default function Publications() {
  return (
    <section id="publications" className="py-24 border-t border-border">
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <p className="section-heading mb-3">05 · Publications</p>
        <h3 className="text-2xl sm:text-3xl font-semibold mb-12">Publications</h3>

        <div className="space-y-5">
          {publications.map((pub) => (
            <div key={pub.venue + pub.date} className="card p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                <h4 className="font-semibold text-foreground text-[15px]">{pub.title}</h4>
                <span className="font-mono text-xs text-muted shrink-0">{pub.date}</span>
              </div>
              <p className="text-sm text-accent-teal mb-2">{pub.venue}</p>
              <p className="text-sm text-muted leading-relaxed">{pub.note}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
