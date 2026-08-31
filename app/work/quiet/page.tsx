import type { Metadata } from "next";
import { notFound } from "next/navigation";
import WorldLink from "@/components/master/WorldLink";
import QuietSoundscape from "@/components/worlds/QuietSoundscape";
import { launchGates } from "@/content/master";

export const metadata: Metadata = {
  title: "Quiet",
  description: "A focus space built around generated ambient sound and a distraction-free Sanctuary.",
  robots: { index: false, follow: false },
};

export default function QuietWorldPage() {
  if (!launchGates.quiet) notFound();

  return (
    <>
      <a className="world-skip" href="#project-content">Skip to project content</a>
      <main id="project-content" tabIndex={-1} className="quiet-world">
        <header className="quiet-world-header">
          <WorldLink href="/#work" world="portfolio">Return to work</WorldLink>
          <span>QUIET / ABSENCE</span>
        </header>

        <section data-chapter="work" data-world="quiet" className="quiet-world-hero" aria-labelledby="quiet-world-title">
          <p className="quiet-world-kicker">ABSENCE</p>
          <h1 id="quiet-world-title">QUIET</h1>
          <p className="quiet-world-thesis">
            A focus space built to remove itself: chosen sound, a little time, and almost nothing else.
          </p>
          <p className="quiet-world-whisper">Nothing starts automatically.</p>
        </section>

        <section data-chapter="work" data-world="quiet" className="quiet-world-sanctuary" aria-labelledby="quiet-sanctuary-title">
          <p className="quiet-world-kicker">A SMALL SANCTUARY</p>
          <h2 id="quiet-sanctuary-title">Introduce sound deliberately.</h2>
          <QuietSoundscape />
        </section>

        <section data-chapter="work" data-world="quiet" className="quiet-world-story" aria-label="Quiet project story">
          <article>
            <span>THE RULE</span>
            <h2>Do not make focus compete with its own interface.</h2>
            <p>Quiet separates arrival from the actual focus state. The deeper you enter, the less interface remains.</p>
          </article>
          <article>
            <span>THE SOUND</span>
            <h2>Generate the atmosphere instead of shipping recordings.</h2>
            <p>Rain, ocean, wind, fire, stream, and colored noise are constructed live from generated signals, filtering, and slow movement.</p>
          </article>
          <article>
            <span>THE SANCTUARY</span>
            <h2>The product becomes quieter when it matters most.</h2>
            <p>The focus mode removes storefront noise and leaves a breathing visual, timer, and the sound layers the person chose.</p>
          </article>
        </section>

        <footer className="quiet-world-footer">
          <p>Quiet is a separate project. This world carries only a small live fragment of its central idea.</p>
          <WorldLink href="/#work" world="portfolio">Return to work</WorldLink>
        </footer>
      </main>
    </>
  );
}
