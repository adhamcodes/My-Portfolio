export type StageStatus = "active" | "building" | "next" | "planned" | "target" | "shipped";

export type JourneyStage = {
  id: string;
  label: string;
  status: StageStatus;
  note: string;
};

export type Project = {
  id: string;
  name: string;
  status: "live" | "released" | "building";
  category: string;
  statement: string;
  problem: string;
  constraint: string;
  decision: string;
  system: string[];
  evidence: string[];
  live?: string;
  repo?: string;
  accent: "blue" | "violet" | "amber" | "green";
};

export const identity = {
  name: "Adham Mahmood",
  handle: "adhamcodes",
  signal: "software → systems → intelligence",
  thesis:
    "Building from first principles, shipping evidence, and moving deliberately toward increasingly capable intelligent systems.",
  location: "Bangladesh",
  email: "adhammahmood83@gmail.com",
  github: "https://github.com/adhamcodes",
};

export const journey: JourneyStage[] = [
  { id: "software", label: "Software", status: "active", note: "Foundations, code, debugging, engineering habits" },
  { id: "systems", label: "Systems", status: "building", note: "Architecture, reliability, delivery, tooling" },
  { id: "backend", label: "Backend + Prod", status: "next", note: "Services, data, operations, production depth" },
  { id: "ml", label: "Machine Learning", status: "planned", note: "Math, modeling, experimentation, evaluation" },
  { id: "ai", label: "AI / ML Systems", status: "target", note: "Intelligent systems with engineering depth" },
];

export const projects: Project[] = [
  {
    id: "foundry180",
    name: "Foundry180",
    status: "building",
    category: "Learning system",
    statement: "A 180-day mastery-gated software engineering academy built to survive without an AI subscription.",
    problem: "Passive tutorials can create the feeling of progress without durable engineering skill.",
    constraint: "The core experience must remain useful offline and without paid AI APIs.",
    decision: "Build authored teaching logic, real exercises, checkers, mistake memory, and evidence-based unlocks.",
    system: ["180-day curriculum", "mastery engine", "local checker", "web edition", "proof vault"],
    evidence: ["180 authored days", "603 passing tests after audit", "real local exercises", "mastery-gated progression"],
    accent: "amber",
  },
  {
    id: "zeroupload",
    name: "ZeroUpload",
    status: "live",
    category: "Browser product",
    statement: "Privacy-first file tooling that keeps processing on the device.",
    problem: "Simple file tasks often require uploading private data to somebody else's server.",
    constraint: "Core processing should happen locally in the browser.",
    decision: "Use browser APIs and on-device processing instead of server-side transformation.",
    system: ["TypeScript", "Browser APIs", "local processing", "privacy-first flow"],
    evidence: ["shipped product", "public repository", "live deployment"],
    live: "https://zeroupload-8e8.pages.dev/",
    repo: "https://github.com/adhamcodes/ZeroUpload",
    accent: "blue",
  },
  {
    id: "git-course",
    name: "Git & GitHub — Zero to Independent",
    status: "released",
    category: "Practice system",
    statement: "A Git course built around prediction, inspection, break/recover drills, and cumulative mastery gates.",
    problem: "Memorizing Git commands does not create a reliable mental model of repository state.",
    constraint: "Practice must be safe enough for a beginner to intentionally break things.",
    decision: "Teach inspect-first workflows with disposable labs and explicit recovery evidence.",
    system: ["28 lessons", "disposable lab", "6 mastery gates", "capstone"],
    evidence: ["public course", "break/recover drills", "collaboration workflow"],
    repo: "https://github.com/adhamcodes/git-github-course",
    accent: "green",
  },
  {
    id: "ai-ml-academy",
    name: "AI / ML Engineering Academy",
    status: "released",
    category: "Learning system",
    statement: "A long-form path from foundations into ML, deep learning, LLM systems, agents, and MLOps.",
    problem: "AI roadmaps often skip the engineering and mathematical foundations that make advanced topics durable.",
    constraint: "The path must preserve prerequisites instead of optimizing for fast demos.",
    decision: "Structure the journey as phase-gated learning from math and scientific Python through production AI systems.",
    system: ["12 phases", "162 core modules", "ML → DL → LLMs", "MLOps + systems"],
    evidence: ["public curriculum", "phase assessments", "released v1.0"],
    repo: "https://github.com/adhamcodes/AI-ML-Engineering-Academy",
    accent: "violet",
  },
];
