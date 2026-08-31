# ADHAM — MASTER 2.0

A living portfolio for Adham Mahmood: software work, learning, history, and current direction projected into one evolving experience.

The canonical design contract is [`docs/PORTFOLIO-MASTER-SPEC.md`](docs/PORTFOLIO-MASTER-SPEC.md).

## Product idea

The portfolio is not a dashboard, résumé skin, or collection of interchangeable project cards. Its core model is:

```text
CONTENT / EVENTS → STATE → EXPERIENCE → WORLD
```

Human-readable content and typed events produce a canonical public state. The visual system projects that state without inventing meaning, progress, expertise, or activity.

## Current experience

- name-first cinematic arrival
- persistent **Living Trace** generated from current public state
- **Index** navigation instead of a command palette or control deck
- human story centered on rebuilding, work, direction, and evidence
- **ZeroUpload / Boundary** project world with a genuine browser-local image operation
- **Growth Engine** with truthful zero states for Foundry180, AI/ML, and automation
- **Pulse** time field that keeps code, learning, work, and career events categorically separate
- **History** as preserved matter rather than a résumé timeline
- restrained opt-in global sound; silence is the default
- adaptive rendering, reduced-motion behavior, touch-native mobile choreography, focus continuity, and resilient fallbacks

A completed Quiet / Absence world also exists in the rebuild branch, but Quiet is launch-gated until its separate public credibility cleanup is complete. The portfolio does not force symmetry by publishing evidence that has not passed its truth gate.

## Living-state rules

Public GitHub activity may enrich the public state as **code activity only**. It cannot become learning progress, mastery, project completion, or career evidence.

Foundry180 personal learning progress remains **0 / 180** until the learning journey actually begins.

The long-term event model keeps these domains separate:

```text
learning ≠ code ≠ work milestones ≠ career milestones
```

The public site is a projection. Future private learning/work systems may write to a canonical event store; the portfolio itself should remain read-only.

## Architecture

The rebuild uses Next.js + React + TypeScript for the semantic application layer and React Three Fiber / Three.js for the Living Trace. Browser audio is procedural and opt-in. Capability and experience directors keep rendering tier, motion preference, input modality, chapter state, route state, and world travel separate from content truth.

The central rendering rule is simple:

> Rendering receives meaning from state. It does not invent meaning.

## Quality gate

The branch carries an independent GitHub Actions gate that performs:

```text
npm ci
→ TypeScript check
→ optimized production build
→ production-server smoke tests
→ home + project-route checks
→ public Living State schema validation
```

Vercel preview validation and real desktop/mobile visual review remain separate release gates.

## Local development

```bash
npm ci
npm run dev
```

Production verification:

```bash
npm run typecheck
npm run build
```

## Truth contract

- no fabricated metrics, ratings, streaks, expertise, or live-state claims
- no calendar time presented as learning progress
- no project promoted merely to fill a grid
- no public technical telemetry used as decoration
- no external source owns canonical identity state
- sparse or zero activity is a valid state
- meaningful history changes state; it is not overwritten

## Branch / release rule

Development happens on `aura-rebuild-v2`.

`main` remains the production safety line and must not change until the complete experience passes desktop/mobile owner review and Adham explicitly approves the release.
