import Ending from "@/components/master/Ending";
import GrowthChapter from "@/components/master/GrowthChapter";
import Hero from "@/components/master/Hero";
import HistoryChapter from "@/components/master/HistoryChapter";
import HumanStory from "@/components/master/HumanStory";
import Index from "@/components/master/Index";
import QuietEncounter from "@/components/master/QuietEncounter";
import WorkEncounter from "@/components/master/WorkEncounter";
import { launchGates } from "@/content/master";

type SemanticShellProps = {
  preview?: boolean;
};

const qualityProbe = process.env.GITHUB_ACTIONS === "true";

export default function SemanticShell({ preview = false }: SemanticShellProps) {
  return (
    <main className="master-shell">
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

      <div id="main-story" tabIndex={-1}>
        <HumanStory />
        <WorkEncounter />
        {launchGates.quiet && <QuietEncounter />}
        <GrowthChapter />
        <HistoryChapter />
        <Ending />
      </div>

      {qualityProbe && (
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
              const params = new URLSearchParams(location.search);
              const review = params.get('review');
              if (!review) return;
              const run = () => {
                document.documentElement.style.scrollBehavior = 'auto';
                document.body.style.scrollBehavior = 'auto';
                if (review === 'index') {
                  document.querySelector('.v4-index-trigger')?.click();
                  return;
                }
                const scene = document.getElementById(review);
                const target = scene?.querySelector('h1, h2, h3') || scene;
                if (!target) return;
                const rect = target.getBoundingClientRect();
                const top = Math.max(0, window.scrollY + rect.top - window.innerHeight * 0.18);
                window.scrollTo(0, top);
              };
              if (document.readyState === 'complete') setTimeout(run, 500);
              else addEventListener('load', () => setTimeout(run, 500), { once: true });
            })();`,
          }}
        />
      )}
    </main>
  );
}
