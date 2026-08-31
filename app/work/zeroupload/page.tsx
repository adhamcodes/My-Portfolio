import type { Metadata } from "next";
import WorldLink from "@/components/master/WorldLink";
import LocalImageTransform from "@/components/worlds/LocalImageTransform";

export const metadata: Metadata = {
  title: "ZeroUpload",
  description: "A browser-first file toolkit built around keeping useful file work on the device when a server is unnecessary.",
};

export default function ZeroUploadWorldPage() {
  return (
    <main className="zu-world">
      <header className="zu-world-header">
        <WorldLink href="/#work" world="portfolio">Return to work</WorldLink>
        <span>ZEROUPLOAD / BOUNDARY</span>
      </header>

      <section data-chapter="work" className="zu-world-hero" aria-labelledby="zu-title">
        <p className="zu-world-kicker">BOUNDARY</p>
        <h1 id="zu-title">ZEROUPLOAD</h1>
        <p className="zu-world-thesis">
          A file tool built around a rule: when useful processing can happen on the device, the file should not need to leave it.
        </p>

        <div className="zu-world-plane" aria-hidden="true">
          <span className="zu-world-plane-line" />
          <span className="zu-world-plane-object">FILE</span>
          <span className="zu-world-plane-device">YOUR DEVICE</span>
          <span className="zu-world-plane-outside">OUTSIDE</span>
        </div>
      </section>

      <section className="zu-world-demo-section" aria-labelledby="zu-demo-title">
        <p className="zu-world-kicker">A REAL OPERATION</p>
        <h2 id="zu-demo-title">Try the rule instead of reading about it.</h2>
        <LocalImageTransform />
      </section>

      <section className="zu-world-story" aria-label="ZeroUpload project story">
        <article>
          <span>WHY</span>
          <h2>Ordinary file work does not always require a remote server.</h2>
          <p>ZeroUpload explores what a browser can do directly for common conversion, compression, editing, PDF, audio, OCR, and image tasks.</p>
        </article>
        <article>
          <span>THE RULE</span>
          <h2>Keep the boundary meaningful.</h2>
          <p>The product is designed around local processing where the supported browser operation can genuinely be performed on-device.</p>
        </article>
        <article>
          <span>THE REALITY</span>
          <h2>Local does not mean limitless.</h2>
          <p>Practical file sizes, speed, memory use, and supported operations still depend on the visitor&apos;s browser and device.</p>
        </article>
      </section>

      <footer className="zu-world-footer">
        <div>
          <p>THE REAL ARTIFACT</p>
          <span>The portfolio creates the encounter. The product and source are the evidence.</span>
        </div>
        <nav aria-label="ZeroUpload links">
          <a href="https://zeroupload.app" target="_blank" rel="noreferrer">Use ZeroUpload ↗</a>
          <a href="https://github.com/adhamcodes/ZeroUpload" target="_blank" rel="noreferrer">Source ↗</a>
          <WorldLink href="/#work" world="portfolio">Return to work</WorldLink>
        </nav>
      </footer>
    </main>
  );
}
