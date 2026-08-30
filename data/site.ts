export type StageState = "verified" | "building" | "active" | "next" | "future";
export type Accent = "rose" | "cyan" | "amber" | "violet";

export type Project = {
  id: string;
  name: string;
  kind: string;
  state: StageState;
  accent: Accent;
  oneLine: string;
  problem: string;
  constraint: string;
  decision: string;
  architecture: string[];
  proof: string[];
  live?: string;
  repo?: string;
  chapter: string;
};

export const identity = {
  name: "Adham Mahmood",
  mark: "ADHAM / 26",
  thesis: "I am building myself into the kind of engineer who can move from first principles to systems to intelligent software — and I want the work to show the transformation in real time.",
  short: "software → systems → intelligence",
  email: "adhammahmood83@gmail.com",
  github: "https://github.com/adhamcodes",
};

export const stages: Array<{ id: string; label: string; state: StageState; note: string }> = [
  { id: "foundations", label: "Software foundations", state: "active", note: "Learning the machinery, not memorizing syntax." },
  { id: "systems", label: "Systems & backend", state: "next", note: "Building toward deeper software architecture and infrastructure thinking." },
  { id: "ml", label: "Machine learning", state: "future", note: "Earned after the software base is strong enough to support it." },
  { id: "ai", label: "Intelligent systems", state: "future", note: "Long-term destination: useful systems that can reason, adapt and act." },
];

export const projects: Project[] = [
  {
    id: "foundry180",
    name: "Foundry180",
    kind: "Learning system / local software",
    state: "building",
    accent: "amber",
    oneLine: "A 180-day software-engineering academy designed to make shallow progress difficult to fake.",
    problem: "Self-study can create the illusion of progress while fundamentals stay fragile.",
    constraint: "The core learning system must remain useful without paid AI APIs or permanent cloud dependencies.",
    decision: "Use authored curriculum, deterministic checkers, mastery gates, local state, a local runner and browser UI as the long-term interface.",
    architecture: ["authored curriculum", "mastery engine", "local state", "trusted runner", "browser academy"],
    proof: ["180 authored days", "6 phases", "130+ exercises", "mastery-gated progression", "600+ automated checks in current audit line"],
    chapter: "THE FORGE",
  },
  {
    id: "zeroupload",
    name: "ZeroUpload",
    kind: "Browser application",
    state: "verified",
    accent: "cyan",
    oneLine: "A privacy-first file-sharing experiment built around doing useful work in the browser instead of treating a server as the default answer.",
    problem: "Quick file-sharing tools often demand accounts, uploads or unnecessary server handling.",
    constraint: "Keep the interaction immediate and minimize what needs to leave the device.",
    decision: "Lean on browser capabilities and a lightweight interaction model rather than a heavy application shell.",
    architecture: ["browser APIs", "local processing", "share flow", "PWA surface"],
    proof: ["working live build", "mobile-capable interface", "no-sign-up path"],
    live: "https://zeroupload-8e8.pages.dev/",
    chapter: "THE SIGNAL",
  },
  {
    id: "windowbiome",
    name: "WindowBiome",
    kind: "Desktop experiment",
    state: "active",
    accent: "violet",
    oneLine: "An Electron desktop overlay experiment that reacts to the active window instead of behaving like another ordinary app panel.",
    problem: "Most desktop customization sits beside your work instead of responding to it.",
    constraint: "The overlay has to feel present without stealing normal interaction from the applications underneath it.",
    decision: "Use a transparent Electron layer plus active-window detection as the foundation for reactive desktop behavior.",
    architecture: ["Electron", "transparent overlay", "active-window detection", "reactive scene"],
    proof: ["minimal Electron shell", "click-through overlay", "active-window detection checkpoint"],
    chapter: "THE BIOME",
  },
  {
    id: "nova",
    name: "Nova",
    kind: "Visual web experiment",
    state: "verified",
    accent: "rose",
    oneLine: "A cinematic marketing-site experiment from the period where I was learning how far visual polish and motion could push a page.",
    problem: "Static marketing pages are easy to make forgettable.",
    constraint: "Make motion feel intentional enough that it supports hierarchy rather than becoming pure decoration.",
    decision: "Use layered motion, glow and depth to test visual direction before moving toward deeper engineering work.",
    architecture: ["Next.js", "TypeScript", "motion system", "visual layers"],
    proof: ["working live preview", "responsive presentation", "motion-heavy interaction"],
    live: "https://nova-preview-six.vercel.app/",
    chapter: "THE ORBIT",
  },
];

export const transmissions = [
  "I care about the machinery under the abstraction.",
  "I would rather show the unfinished trajectory than fake the final title.",
  "I like software that feels engineered and designed at the same time.",
  "This site is allowed to mutate as I do.",
];
