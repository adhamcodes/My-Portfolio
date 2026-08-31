import type { WorkEntry } from "@/core/contracts";

export const masterIdentity = {
  name: "Adham Mahmood",
  thesis:
    "Rebuilding from software foundations toward software engineering and AI/ML — using real projects, recorded progress, and shipped work as evidence.",
  currentFrame:
    "The direction is clear. The proof is still being built, and this portfolio is designed to change as that becomes true.",
  github: "https://github.com/adhamcodes",
} as const;

export const featuredWork: WorkEntry[] = [
  {
    id: "zeroupload",
    name: "ZeroUpload",
    summary:
      "A browser-first file toolkit built around a simple boundary: useful file work should stay on the device when a server is unnecessary.",
    centralIdea: "Boundary",
    maturity: "maintained",
    liveUrl: "https://zeroupload.app",
    sourceUrl: "https://github.com/adhamcodes/ZeroUpload",
    featured: true,
  },
];

export const historicalWork: WorkEntry[] = [
  {
    id: "nova",
    name: "Nova",
    summary:
      "A visual web experiment from an earlier phase, preserved as evidence of evolution rather than presented as current flagship engineering work.",
    centralIdea: "Earlier visual experiment",
    maturity: "archived",
    featured: false,
  },
];

export const allPublicWork: WorkEntry[] = [...featuredWork, ...historicalWork];

export const growthTracks = [
  {
    id: "foundry180",
    label: "Software Engineering / Foundry180",
    status: "not_started",
    note:
      "The curriculum is prepared and the learning system is being finished. Personal progress begins only when the learning journey actually starts.",
  },
  {
    id: "ai-ml",
    label: "AI/ML Engineering",
    status: "not_started",
    note:
      "A learning path and future specialization. It is direction, not a claim of current mastery.",
  },
  {
    id: "automation",
    label: "AI Automation",
    status: "not_started",
    note:
      "A supporting capability to develop alongside stronger software foundations, not a third headline identity.",
  },
] as const;

export const historyEntries = historicalWork.map((work) => ({
  id: work.id,
  label: work.name,
  note: work.summary,
}));
