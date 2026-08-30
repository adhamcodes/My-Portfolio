# ADHAM MAHMOOD — INTERACTIVE PORTFOLIO

A portfolio that behaves like one of the projects instead of acting as a static wrapper around them.

The public experience is intentionally human and editorial; the technical machinery stays underneath it. The site combines Next.js, React, TypeScript, React Three Fiber, Three.js, custom GLSL, GSAP, Motion, native browser APIs, procedural Web Audio, local state and a device-aware runtime layer.

## Design rule

The goal is not to display the largest possible number of effects. It is to make different parts of the portfolio feel deliberately different while still belonging to the same person.

Large typography carries the narrative. The 3D field appears when it matters and retreats when reading should win. Project pages use interactive models specific to the ideas they represent. Technical UI is reserved for places where there is real technical information to inspect.

## What is real

- scene-aware WebGL visual field with custom GLSL deformation
- deterministic particle layout and adaptive render quality
- three persistent visual modes with different motion, lighting and procedural-audio behavior
- scroll and pointer response
- project-specific interactive models rather than a repeated case-study template
- Foundry180 curriculum / phase / mastery-check model
- portfolio architecture explorer
- ZeroUpload local-first flow model
- WindowBiome focus-aware desktop model
- Nova motion / depth / hierarchy study
- project deep links, browser history and shareable state
- deterministic build signature derived from current portfolio state
- remembered project exploration using local storage
- returning-visitor memory stored only in the browser
- completion moment after all projects are explored
- attention-aware navigation that retreats during reading and scrolling
- native View Transition enhancement with Motion fallback
- opt-in procedural Web Audio
- XRAY inspection layer
- quick navigation (`/` or `Ctrl/Cmd + K`)
- real browser capability checks
- live FPS, LCP, CLS and long-task telemetry
- high / balanced / low render tiers
- mobile-aware 3D composition
- reduced-motion, high-contrast, coarse-pointer and low-device fallbacks
- visual-layer and application error boundaries
- metadata, sitemap, robots, manifest, social artwork and structured data
- production security headers
- print fallback
- one hidden interaction

## Architecture

```text
PORTFOLIO DATA
    ↓
NEXT.JS / REACT / TYPESCRIPT
    ↓
URL + LOCAL MEMORY
    ↓
SCENE DIRECTION
    ├── narrative section detection
    ├── background changes
    ├── attention-aware interface density
    └── 3D-field presence / composition
    ↓
MOTION + INTERACTION
    ├── GSAP scroll choreography
    ├── Motion transitions
    ├── pointer / scroll response
    └── quick controls
    ↓
3D FIELD
    ├── React Three Fiber
    ├── Three.js
    ├── custom GLSL
    └── adaptive quality
    ↓
BROWSER FEATURES
    ├── View Transitions
    ├── Web Audio
    ├── PerformanceObserver
    └── capability detection
```

## Project rule

Each project gets an interactive model that explains something specific about it:

- **Foundry180** — curriculum structure and proof-gated progression.
- **This Portfolio** — the architecture of the site itself.
- **ZeroUpload** — the local-first browser flow.
- **WindowBiome** — active-window-aware desktop behavior.
- **Nova** — motion, depth and hierarchy experimentation.

These are explanatory models. They do not pretend to be live telemetry from the underlying products.

## Controls

| Control | Action |
| --- | --- |
| `A` | Change visual mode |
| `X` | Toggle XRAY |
| `/` | Open quick navigation |
| `Ctrl/Cmd + K` | Open quick navigation |
| `Esc` | Close an open project / navigation |

The **Under the Hood** section also exposes real runtime measurements, browser capability checks and a visual-field intensity control.

## Runtime resilience

The experience is visually ambitious but does not assume a high-end machine. It starts conservatively, samples real frame timing after the initial reveal, considers available hardware signals when they exist, and selects a render tier. Optional browser APIs degrade to fallbacks. Reduced-motion preferences remove nonessential movement. If the 3D layer fails, the portfolio remains usable.

## Truth contract

Visual ambition is not permission to fabricate engineering evidence.

- Foundry180 remains **BUILDING**. Its curriculum quality audit is complete: 180 authored days, 130 exercises and 603 automated tests passing, but the full browser product is still being built.
- Project simulations are explanatory interactive models.
- Future trajectory stages remain future work.
- Runtime telemetry comes from the current browser.

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

`1.0-RC` — final owner-review release candidate.

The production branch remains unchanged until explicit approval.
