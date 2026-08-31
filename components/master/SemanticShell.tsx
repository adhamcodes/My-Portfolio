import GrowthChapter from "@/components/master/GrowthChapter";
import Hero from "@/components/master/Hero";
import HumanStory from "@/components/master/HumanStory";
import Index from "@/components/master/Index";
import LivingTrace from "@/components/master/LivingTrace";
import WorkEncounter from "@/components/master/WorkEncounter";
import { historyEntries, masterIdentity } from "@/content/master";

type SemanticShellProps = {
  preview?: boolean;
};

export default function SemanticShell({ preview = false }: SemanticShellProps) {
  return (
    <main className="master-shell">
      <LivingTrace />
      <a className="master-skip" href="#main-story">Skip to story</a>

      <header className="master-header">
        <a className="master-wordmark" href="#origin" aria-label="Adham Mahmood, back to beginning">
          <strong>ADHAM</strong><span>MAHMOOD</span>
        </a>
        <div className="master-header-actions">
          {preview && <span className="master-preview-tag">INTERNAL BUILD</span>}
          <Index />
        </div>
      </header>

      <Hero />

      <div id="main-story">
        <HumanStory />
        <WorkEncounter />
        <GrowthChapter />

        <section id="history" data-chapter="history" className="master-scene master-history" aria-labelledby="history-title">
          <p className="master-number">04 / HISTORY</p>
          <div className="master-section-head">
            <h2 id="history-title">Nothing meaningful gets erased.</h2>
            <p>Earlier work can become history without pretending it represents the present.</p>
          </div>
          {historyEntries.map((entry) => (
            <article key={entry.id} className="master-history-entry">
              <h3>{entry.label}</h3>
              <p>{entry.note}</p>
            </article>
          ))}
        </section>

        <section id="present" data-chapter="present" className="master-scene master-present" aria-labelledby="present-title">
          <p className="master-number">05 / PRESENT</p>
          <h2 id="present-title">THIS IS THE CURRENT FRAME.</h2>
          <p>The structure continues beyond what exists today. Future work and growth should enter because reality changed, not because the layout needs filling.</p>
          <div className="master-contact">
            <a href={masterIdentity.github}>GitHub <span aria-hidden="true">↗</span></a>
            {preview && <span>Work email connects at the final contact pass.</span>}
          </div>
        </section>
      </div>
    </main>
  );
}
