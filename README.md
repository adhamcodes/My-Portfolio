# ADHAM / AURA SYSTEM

A portfolio that behaves like a project instead of a static wrapper around projects.

**Aura System** is a living engineering identity built with Next.js, React, TypeScript, React Three Fiber, Three.js, custom GLSL, GSAP, Motion, native browser APIs and a device-aware runtime layer.

The core idea is simple: the interface should change when the person, work and current engineering pressure change.

## What is real

- GPU-rendered 3D identity field
- custom GLSL signal membrane
- scene-directed Core Evolution across the narrative
- three persistent Aura personalities with distinct motion, particles, rendering behavior and generative audio profiles
- scroll-velocity and pointer-driven kinetic response
- bespoke interactive project worlds instead of one shared case-study template
- Foundry180 interactive curriculum / phase / mastery-gate system model
- Aura System peelable architecture model
- ZeroUpload local-first pipeline simulation
- WindowBiome active-window / reactive-overlay simulation
- Nova cinematic motion/depth/hierarchy study
- project deep links, browser-history behavior and shareable state
- deterministic identity glyph generated from current project/stage state
- remembered project exploration using local storage
- returning-visitor reconnect boot with local-only memory
- system-familiarity completion state after all worlds are mapped
- attention-aware HUD that retreats while reading and scrolling
- live signal feed driven by actual system interactions
- native View Transition enhancement with Motion fallback
- opt-in generative Web Audio soundscape
- XRAY developer layer
- operator deck (`/` or `Ctrl/Cmd + K`)
- browser capability self-test
- live FPS, LCP, CLS and long-task telemetry
- adaptive quality governor for high / balanced / low render tiers
- mobile-aware GPU composition
- reduced-motion, high-contrast, coarse-pointer and low-device fallbacks
- visual-layer and application error boundaries
- metadata, sitemap, robots, manifest, OG image and structured data
- production security headers
- print-safe fallback presentation
- an undocumented protocol layer

## System layers

```text
IDENTITY DATA
    ↓
NEXT.JS / REACT APPLICATION
    ↓
STATE + MEMORY
    ├── URL project state
    ├── local Aura preference
    ├── exploration memory
    └── returning-visitor state
    ↓
SCENE DIRECTOR
    ├── narrative scene detection
    ├── attention-aware HUD
    └── Core Evolution commands
    ↓
MOTION + INTERACTION BUS
    ├── GSAP scroll choreography
    ├── Motion transitions
    ├── kinetic pointer/scroll signal
    └── operator controls
    ↓
GPU FIELD
    ├── React Three Fiber
    ├── Three.js
    ├── custom GLSL membrane
    ├── Aura-specific behavior
    └── adaptive render quality
    ↓
NATIVE WEB
    ├── View Transitions
    ├── Web Audio
    ├── PerformanceObserver
    └── capability detection
```

## Project-world rule

A project world is allowed to be visually related to the global identity, but it must not be only a differently colored copy of another project.

Each flagship world gets a miniature interaction that explains something specific about the project:

- **Foundry180** exposes curriculum, phase and mastery-loop structure.
- **Aura System** lets the visitor peel through the portfolio architecture itself.
- **ZeroUpload** expresses the local-first browser pipeline.
- **WindowBiome** expresses focus-aware desktop behavior.
- **Nova** preserves the motion-heavy visual experimentation of that project honestly.

These are explanatory interactive models; they do not pretend to be live telemetry from the underlying products.

## Controls

| Control | Action |
| --- | --- |
| `A` | Cycle Aura personality |
| `X` | Toggle XRAY |
| `/` | Open Operator Deck |
| `Ctrl/Cmd + K` | Open Operator Deck |
| `Esc` | Close project world / deck |

The Machine section contains additional live controls for field energy, browser probes and signal injection.

## Evolution model

Content and identity state live in `data/site.ts`.

Changing a project from `building` to `verified`, moving the active stage, or adding a new system changes more than text: those values feed the living identity surface, deterministic glyph, project atlas and system narrative.

The intended workflow is to update state rather than redesign the portfolio every few months.

## Runtime resilience

Aura System is deliberately maximalist, but the implementation is not allowed to assume a high-end machine.

The runtime samples the visitor's device and frame rate, then chooses a render tier. The scene-directed core also adapts its horizontal composition to narrower GPU viewports. Optional browser APIs degrade to fallbacks. Reduced-motion preferences remove nonessential movement. If the GPU presentation layer fails, the portfolio remains usable.

## Truth contract

Visual ambition is not permission to fabricate engineering evidence.

- Foundry180 remains marked **BUILDING** while its final curriculum-quality audit is pending.
- Project-world simulations are labeled as interactive models/simulations.
- Future trajectory stages remain visibly future work.
- Runtime telemetry comes from the current browser rather than invented numbers.

## Local development

```bash
npm install
npm run dev
```

Production check:

```bash
npm run build
```

## Status

`0.9-RC` — monster-pass release candidate for owner desktop/mobile visual and interaction review.

The production branch remains unchanged until the release candidate is explicitly approved.
