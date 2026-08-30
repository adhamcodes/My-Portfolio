# ADHAM // BUILD.STATE

A living engineering identity system rather than a static portfolio.

## Stack

- Next.js
- TypeScript
- React
- CSS design system
- Vercel previews

## Core idea

The site evolves from structured data in `data/identity.ts`.

Projects, current focus, and trajectory change as the work changes. The interface is intentionally built so future updates usually modify data rather than redesign the site.

## Signature interaction

`INSPECT` mode exposes a second layer of the portfolio for developers without disturbing the normal visitor experience.

## Development

```bash
npm install
npm run dev
```

Production verification:

```bash
npm run build
npm run typecheck
```

## Design principles

- truth over titles
- evidence over badge walls
- meaningful motion over decoration
- current work over generic service copy
- depth before height

See `docs/IDENTITY_SYSTEM.md` for the creative and evolution rules.
