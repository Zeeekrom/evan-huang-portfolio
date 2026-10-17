import { projects } from "@/data/content";

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.65.5.5 5.66.5 12.03c0 5.09 3.29 9.4 7.86 10.93.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.880-1.55-3.88-1.55-.52-1.34-1.28-1.7-1.28-1.7-1.04-.72.08-.71.08-.71 1.16.08 1.77 1.2 1.77 1.2 1.02 1.76 2.68 1.25 3.34.96.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.72 0-1.26.45-2.29 1.19-3.090-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a10.9 10.9 0 0 1 5.79 0c2.2-1.5 3.17-1.18 3.17-1.18.64 1.59.24 2.77.12 3.06.74.8 1.19 1.83 1.19 3.09 0 4.45-2.7 5.42-5.27 5.71.42.36.78 1.07.78 2.17 0 1.57-.01 2.83-.01 3.22 0 .31.21.68.8.56A10.53 10.53 0 0 0 23.5 12.03C23.5 5.66 18.35.5 12 .5Z" />
    </svg>
  );
}

export default function Projects() {
  const featured = projects.filter((p) => p.featured);
  const rest = projects.filter((p) => !p.featured);

  return (
    <section id="projects" className="py-24 border-t border-border">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <p className="section-heading mb-3">03 · Projects</p>
        <h3 className="text-2xl sm:text-3xl font-semibold mb-12">Selected Projects</h3>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {featured.map((project) => (
            <article key={project.slug} className="card p-6 flex flex-col">
              <div className="flex items-start justify-between gap-3 mb-1">
                <h4 className="text-lg font-semibold text-foreground">{project.title}</h4>
                {project.link && (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-muted hover:text-accent-teal transition-colors"
                    aria-label="View on GitHub"
                  >
                    <GithubIcon />
                  </a>
                )}
              </div>
              <p className="font-mono text-xs text-muted mb-4">{project.period}</p>
              <p className="text-sm text-foreground/85 leading-relaxed mb-4">{project.description}</p>
              {project.bullets.length > 0 && (
                <ul className="space-y-2 mb-5 text-sm text-muted">
                  {project.bullets.map((b, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-accent-teal mt-1">▸</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-auto flex flex-wrap gap-2 pt-2">
                {project.tags.map((tag) => (
                  <span key={tag} className="chip">
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>

        <h4 className="text-sm text-muted mb-4 font-mono">More Projects</h4>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {rest.map((project) => (
            <article key={project.slug} className="card p-5 flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="text-sm font-semibold text-foreground">{project.title}</h4>
                {project.link && (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-muted hover:text-accent-teal transition-colors"
                    aria-label="View on GitHub"
                  >
                    <GithubIcon />
                  </a>
                )}
              </div>
              <p className="font-mono text-xs text-muted mb-3">{project.period}</p>
              <p className="text-sm text-foreground/80 leading-relaxed mb-4">{project.description}</p>
              <div className="mt-auto flex flex-wrap gap-2 pt-2">
                {project.tags.map((tag) => (
                  <span key={tag} className="chip">
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
