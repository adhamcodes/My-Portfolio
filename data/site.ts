export type StageState = "verified" | "building" | "active" | "next" | "future";
export type Accent = "rose" | "cyan" | "amber" | "violet";
export type AuraMode = "pulse" | "forge" | "void";

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
  principle: string;
  next: string;
  architecture: string[];
  proof: string[];
  live?: string;
  repo?: string;
  chapter: string;
};

export const identity = {
  name: "Adham Mahmood",
  mark: "ADHAM / 26",
  version: "1.0-RC",
  thesis: "I build software to understand how it really works — from fundamentals and browser experiments to larger systems, with intelligent software as the long-term direction.",
  short: "software → systems → intelligence",
  email: "adhammahmood83@gmail.com",
  github: "https://github.com/adhamcodes",
};

export const auraModes: Array<{ id: AuraMode; label: string; note: string }> = [
  { id: "pulse", label: "PULSE", note: "bright / reactive" },
  { id: "forge", label: "FORGE", note: "warm / weighty" },
  { id: "void", label: "VOID", note: "quiet / spacious" },
];

export const stages: Array<{ id: string; label: string; state: StageState; note: string }> = [
  { id: "foundations", label: "Software foundations", state: "active", note: "First principles, deliberate practice, and systems I can explain rather than merely assemble." },
  { id: "systems", label: "Systems & backend", state: "next", note: "Architecture, infrastructure, networking, data, and software that has to survive beyond the demo." },
  { id: "ml", label: "Machine learning", state: "future", note: "A future layer built on top of a software base strong enough to carry it." },
  { id: "ai", label: "Intelligent systems", state: "future", note: "The long-term goal: useful software that can reason, adapt, and act without hiding weak engineering underneath." },
];

export const projects: Project[] = [
  {
    id: "foundry180",
    name: "Foundry180",
    kind: "Learning system / local software",
    state: "building",
    accent: "amber",
    oneLine: "A 180-day software-engineering academy built around practice, feedback, and proof instead of passive completion.",
    problem: "Self-study can feel productive while the fundamentals underneath it remain fragile.",
    constraint: "The core learning experience has to stay useful locally and cannot depend on paid AI APIs to function.",
    decision: "Author the curriculum, make checks deterministic, keep progress local, and treat AI as optional assistance rather than the foundation of the product.",
    principle: "Progress should be demonstrated through work, not inferred from time spent reading.",
    next: "Turn the audited curriculum and local engine into the full browser learning experience with a trusted local runner.",
    architecture: ["authored curriculum", "mastery engine", "local progress", "trusted runner", "browser academy"],
    proof: ["180 authored days", "6 phases", "130 exercises", "603 automated tests passing", "curriculum quality audit complete"],
    chapter: "CURRENT BUILD",
  },
  {
    id: "aura-system",
    name: "This Portfolio",
    kind: "Interactive portfolio / browser experiment",
    state: "active",
    accent: "rose",
    oneLine: "A portfolio that behaves like software: responsive 3D, real browser checks, remembered state, and project-specific interactions.",
    problem: "Most portfolios become static wrappers around projects and age faster than the person they describe.",
    constraint: "Push visual and interaction design hard without sacrificing readability, resilience, accessibility, or weaker devices.",
    decision: "Keep identity and project data structured, let the visual engine react to the page and the visitor, and make optional browser features degrade cleanly.",
    principle: "The technology should disappear into the experience. If something looks advanced, there should be real behavior underneath it.",
    next: "Finish owner review and cross-device polish, then ship the production 1.0 version.",
    architecture: ["Next.js + React", "Three.js / R3F", "custom GLSL", "GSAP + Motion", "browser APIs", "Web Audio"],
    proof: ["custom shader-driven visual field", "scene-aware WebGL composition", "project-specific interactive models", "procedural Web Audio", "XRAY inspection view", "live browser checks and performance telemetry"],
    repo: "https://github.com/adhamcodes/My-Portfolio/tree/aura-rebuild-v2",
    chapter: "BEHIND THE SITE",
  },
  {
    id: "zeroupload",
    name: "ZeroUpload",
    kind: "Browser application",
    state: "verified",
    accent: "cyan",
    oneLine: "A privacy-first file-sharing experiment built around doing useful work in the browser before reaching for a server.",
    problem: "Quick file-sharing tools often add accounts, uploads, and server handling before the task actually needs them.",
    constraint: "Keep the interaction immediate while minimizing what has to leave the device.",
    decision: "Use browser capabilities and a lightweight local-first flow instead of building a heavier application shell by default.",
    principle: "Do locally what does not need a server.",
    next: "Keep it as a compact proof of browser-first thinking and revisit it when a stronger product constraint appears.",
    architecture: ["browser APIs", "local processing", "share flow", "PWA surface"],
    proof: ["working live build", "mobile-capable interface", "no-sign-up path"],
    live: "https://zeroupload-8e8.pages.dev/",
    chapter: "LOCAL FIRST",
  },
  {
    id: "windowbiome",
    name: "WindowBiome",
    kind: "Desktop experiment",
    state: "active",
    accent: "violet",
    oneLine: "An Electron overlay experiment that reacts to the active window instead of behaving like another permanent desktop panel.",
    problem: "Most desktop customization sits beside your work instead of responding to what you are actually doing.",
    constraint: "The overlay has to feel present without stealing normal interaction from the applications underneath it.",
    decision: "Use a transparent Electron layer and active-window detection as the foundation for reactive desktop behavior.",
    principle: "Desktop software can become environmental instead of demanding another window of its own.",
    next: "Turn the proven overlay and active-window foundation into richer reactive behavior without compromising click-through interaction.",
    architecture: ["Electron", "transparent overlay", "active-window detection", "reactive scene"],
    proof: ["minimal Electron shell", "click-through overlay", "active-window detection checkpoint"],
    chapter: "DESKTOP REACTION",
  },
  {
    id: "nova",
    name: "Nova",
    kind: "Visual web experiment",
    state: "verified",
    accent: "rose",
    oneLine: "A cinematic web experiment from the period where motion, hierarchy, and visual polish were the main material.",
    problem: "Static marketing pages are easy to make forgettable.",
    constraint: "Make motion support hierarchy rather than turning the page into an effects reel.",
    decision: "Use layered motion, glow, and depth to study visual direction before moving toward deeper engineering work.",
    principle: "Visual craft matters, but it should become one layer of stronger engineering rather than the whole identity.",
    next: "Preserve it as evidence of that visual-design era instead of pretending it was a deeper system than it was.",
    architecture: ["Next.js", "TypeScript", "motion system", "visual layers"],
    proof: ["working live preview", "responsive presentation", "motion-heavy interaction"],
    live: "https://nova-preview-six.vercel.app/",
    chapter: "MOTION STUDY",
  },
];

export const portfolioSystem = {
  version: `BUILD ${identity.version}`,
  layers: [
    { id: "foundation", role: "APPLICATION", tech: "Next.js · React · TypeScript", job: "The page structure, project data, metadata, routing, and component architecture.", path: "application + data" },
    { id: "render", role: "3D FIELD", tech: "Three.js · React Three Fiber", job: "A responsive visual field that changes position, presence, and complexity as the page moves.", path: "3D render layer" },
    { id: "shader", role: "SHADER", tech: "Custom GLSL", job: "The procedural surface treatment around the 3D field, driven by time, visual mode, and intensity.", path: "GPU shader layer" },
    { id: "choreography", role: "MOTION", tech: "GSAP · Motion", job: "Scroll reveals, transitions, springs, project entrances, and interaction choreography.", path: "motion + interaction" },
    { id: "browser", role: "BROWSER", tech: "View Transitions · Web Audio", job: "Native browser transitions and opt-in procedural sound, with fallbacks where an API is unavailable.", path: "browser capability layer" },
    { id: "memory", role: "MEMORY", tech: "URL state · Local Storage", job: "Deep-linked projects, remembered visual mode, returning-visitor state, and locally remembered exploration.", path: "local state layer" },
    { id: "director", role: "SCENE", tech: "Scroll state · environment direction", job: "Coordinates the visual field, background, and interface density with the part of the story currently on screen.", path: "scene direction layer" },
    { id: "resilience", role: "PERFORMANCE", tech: "Adaptive runtime governor", job: "Samples the device, chooses a render tier, respects reduced motion, and keeps optional features from becoming requirements.", path: "runtime guards" },
  ],
};

export const transmissions = [
  "I care about what happens beneath the abstraction.",
  "I do not want progress I cannot prove.",
  "Design and engineering are stronger when they reinforce each other.",
  "This site should change when the work changes.",
];
