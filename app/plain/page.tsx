import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/content/site";
import { districts } from "@/content/districts";
import { skills, clusters } from "@/content/skills";
import { projects } from "@/content/projects";

export const metadata: Metadata = {
  title: "M S Shruthi (plain version)",
  description: site.tagline,
};

// Same content as the 3D city, as simple readable HTML.
export default function Plain() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 leading-relaxed text-ink">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan">
        <Link href="/" className="underline underline-offset-4">Back to the city</Link>
      </p>

      <h1 className="mt-6 font-mono text-4xl font-bold">{site.name}</h1>
      <p className="mt-4 text-lg text-muted">{site.tagline}</p>

      <section className="mt-14" aria-labelledby="districts">
        <h2 id="districts" className="font-mono text-xl font-bold">What I do</h2>
        {districts.map((d) => (
          <article key={d.id} className="mt-8">
            <h3 className="font-mono text-lg">
              {d.name} <span className="text-muted">/ {d.ability}</span>
            </h3>
            <p className="mt-2 text-muted">{d.body}</p>
            <p className="mt-2 text-sm text-muted/80">{d.tags.join(", ")}</p>
          </article>
        ))}
      </section>

      <section className="mt-14" aria-labelledby="skills">
        <h2 id="skills" className="font-mono text-xl font-bold">Skills</h2>
        {clusters.map((c) => (
          <div key={c.id} className="mt-6">
            <h3 className="font-mono text-sm tracking-[0.2em]">{c.id}</h3>
            <ul className="mt-2 space-y-1">
              {skills
                .filter((s) => s.cluster === c.id)
                .map((s) => (
                  <li key={s.id}>
                    <strong className="font-medium">{s.label}.</strong>{" "}
                    <span className="text-muted">{s.line}</span>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="mt-14" aria-labelledby="projects">
        <h2 id="projects" className="font-mono text-xl font-bold">Things I made</h2>
        {projects.map((p) => (
          <article key={p.id} className="mt-6">
            <h3 className="font-mono text-lg">{p.title}</h3>
            <p className="text-sm text-muted/80">{p.kind}</p>
            <p className="mt-1 text-muted">{p.summary}</p>
          </article>
        ))}
      </section>

      <section className="mt-14" aria-labelledby="contact">
        <h2 id="contact" className="font-mono text-xl font-bold">{site.contact.heading}</h2>
        <ul className="mt-4 space-y-1">
          <li><a className="underline underline-offset-4" href={`mailto:${site.contact.email}`}>{site.contact.email}</a></li>
          <li><a className="underline underline-offset-4" href={site.contact.linkedin}>LinkedIn</a></li>
          <li><a className="underline underline-offset-4" href={site.contact.github}>GitHub</a></li>
        </ul>
      </section>
    </main>
  );
}
