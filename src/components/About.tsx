import { about } from "@/data/content";

export default function About() {
  return (
    <section id="about" className="py-24 border-t border-border">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <p className="section-heading mb-3">01 · {about.heading}</p>

        <div className="grid md:grid-cols-3 gap-12">
          <div className="md:col-span-2 space-y-5">
            {about.paragraphs.map((p, i) => (
              <p key={i} className="text-foreground/90 leading-relaxed text-[15px] sm:text-base">
                {p}
              </p>
            ))}
          </div>

          <div className="space-y-4">
            {about.facts.map((fact, i) => (
              <div key={i} className="card p-4">
                <p className="text-xs text-muted mb-1">{fact.label}</p>
                <p className="text-sm font-medium text-foreground">{fact.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
