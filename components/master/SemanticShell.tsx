import Ending from "@/components/master/Ending";
import GrowthChapter from "@/components/master/GrowthChapter";
import Hero from "@/components/master/Hero";
import HistoryChapter from "@/components/master/HistoryChapter";
import HumanStory from "@/components/master/HumanStory";
import Index from "@/components/master/Index";
import QuietEncounter from "@/components/master/QuietEncounter";
import WorkEncounter from "@/components/master/WorkEncounter";

type SemanticShellProps = {
  preview?: boolean;
};

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

      <div id="main-story">
        <HumanStory />
        <WorkEncounter />
        <QuietEncounter />
        <GrowthChapter />
        <HistoryChapter />
        <Ending />
      </div>
    </main>
  );
}
