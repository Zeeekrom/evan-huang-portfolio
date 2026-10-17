import { internships, startups, education, type ExperienceItem } from "@/data/content";

function TimelineItem({ item, index, total }: { item: ExperienceItem; index: number; total: number }) {
  return (
    <div className="relative pl-8 pb-10 last:pb-0">
      {index !== total - 1 && (
        <span className="absolute left-[5px] top-3 bottom-0 w-px bg-border" aria-hidden />
      )}
      <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-accent-teal shadow-[0_0_0_4px_rgba(31,184,171,0.15)]" />

      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
        <h4 className="font-semibold text-foreground">{item.org}</h4>
        <span className="font-mono text-xs text-muted">{item.period}</span>
      </div>
      <p className="text-sm text-accent-teal mb-3">
        {item.role}
        {item.type && <span className="text-muted"> · {item.type}</span>}
      </p>
      <ul className="space-y-2 text-sm text-muted">
        {item.bullets.map((b, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-accent-teal/70 mt-1">▸</span>
            <span className="leading-relaxed">{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Experience() {
  return (
    <section id="experience" className="py-24 border-t border-border bg-background-elevated/40">
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <p className="section-heading mb-3">04 · Experience</p>
        <h3 className="text-2xl sm:text-3xl font-semibold mb-12">Work &amp; Startup Experience</h3>

        <div className="mb-14">
          <h4 className="font-mono text-sm text-muted mb-6 uppercase tracking-wide">
            Industry Internships (China)
          </h4>
          {internships.map((item, i) => (
            <TimelineItem key={item.org + item.period} item={item} index={i} total={internships.length} />
          ))}
        </div>

        <div className="mb-14">
          <h4 className="font-mono text-sm text-muted mb-6 uppercase tracking-wide">
            Startup Experience
          </h4>
          {startups.map((item, i) => (
            <TimelineItem key={item.org + item.period} item={item} index={i} total={startups.length} />
          ))}
        </div>

        <div>
          <h4 className="font-mono text-sm text-muted mb-6 uppercase tracking-wide">Education</h4>
          <div className="grid sm:grid-cols-2 gap-4">
            {education.map((edu) => (
              <div key={edu.school + edu.period} className="card p-4">
                <p className="text-sm font-semibold text-foreground mb-1">{edu.degree}</p>
                <p className="text-sm text-accent-teal mb-1">{edu.school}</p>
                <p className="text-xs text-muted font-mono">{edu.period}</p>
                {edu.detail && <p className="text-xs text-muted mt-1">{edu.detail}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
