import { skillGroups } from "@/data/content";

export default function Skills() {
  return (
    <section id="skills" className="py-24 border-t border-border bg-background-elevated/40">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <p className="section-heading mb-3">02 · Skills</p>
        <h3 className="text-2xl sm:text-3xl font-semibold mb-12">Technical Skills</h3>

        <div className="grid sm:grid-cols-2 gap-5">
          {skillGroups.map((group, i) => (
            <div key={i} className="card p-5">
              <h4 className="text-sm font-semibold text-accent-teal mb-3">{group.title}</h4>
              <div className="flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <span key={item} className="chip">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
