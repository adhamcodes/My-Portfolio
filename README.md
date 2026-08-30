# ADHAM / AURA SYSTEM

A portfolio that behaves like a project instead of a static wrapper around projects.

**Aura System** is a living engineering identity built with Next.js, React, TypeScript, React Three Fiber, Three.js, custom GLSL, GSAP, Motion, native browser APIs and a device-aware runtime layer.

The core idea is simple: the site should evolve when the person and work evolve.

## What is real

- GPU-rendered 3D identity field
- custom GLSL signal membrane
- three persistent aura states
- scroll-velocity and pointer-driven kinetic response
- project worlds with deep links and shareable state
- deterministic identity glyph generated from current project/stage state
- remembered project exploration using local storage
- native View Transition enhancement with Motion fallback
- opt-in generative Web Audio soundscape
- XRAY developer layer
- operator deck (`/` or `Ctrl/Cmd + K`)
- browser capability self-test
- live FPS, LCP, CLS and long-task telemetry
- adaptive quality governor for high / balanced / low render tiers
- reduced-motion, high-contrast, coarse-pointer and low-device fallbacks
- visual-layer and application error boundaries
- metadata, sitemap, robots, manifest, OG image and structured data
- print-safe fallback presentation
- one undocumented protocol

## System layers

```text
IDENTITY DATA
    ↓
NEXT.JS / REACT APPLICATION
    ↓
MOTION + INTERACTION BUS
    ├── GSAP scroll choreography
    ├── Motion transitions
    ├── URL + local state memory
    └── operator controls
    ↓
GPU FIELD
    ├── React Three Fiber
    ├── Three.js
    ├── custom GLSL membrane
    └── adaptive render quality
    ↓
NATIVE WEB
    ├── View Transitions
    ├── Web Audio
    ├── PerformanceObserver
    └── capability detection
```

## Controls

| Control | Action |
| --- | --- |
| `A` | Cycle aura state |
| `X` | Toggle XRAY |
| `/` | Open operator deck |
| `Ctrl/Cmd + K` | Open operator deck |
| `Esc` | Close project world / deck |

The Machine section contains additional live controls for field energy, browser probes and signal injection.

## Evolution model

Content and identity state live in `data/site.ts`.

Changing a project from `building` to `verified`, moving the active stage, or adding a new system changes more than text: those values feed the living identity surface and deterministic glyph.

The intended workflow is to update state rather than redesign the portfolio every few months.

## Runtime resilience

Aura System is deliberately maximalist, but the implementation is not allowed to assume a high-end machine.

The runtime samples the visitor's device and frame rate, then chooses a render tier. Optional browser APIs degrade to fallbacks. Reduced-motion preferences remove nonessential movement. If the GPU presentation layer fails, the portfolio remains usable.

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

`0.5-RC` — release candidate for owner visual/interaction review.

The production branch remains unchanged until the release candidate is approved.
