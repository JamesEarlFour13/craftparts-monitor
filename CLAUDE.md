# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Craftparts Monitor is a Next.js 16 application built with React 19, TypeScript, and Tailwind CSS v4. It uses the App Router.

## Commands

- `bun dev` — start dev server
- `bun run build` — production build
- `bun run lint` — run ESLint (flat config with next/core-web-vitals and next/typescript)
- `bun start` — serve production build

## Tech Stack & Conventions

- **Package manager:** Bun (use `bun` instead of `npm`/`yarn`)
- **UI components:** shadcn/ui v4 with `base-maia` style, using Base UI primitives (`@base-ui/react`) and `class-variance-authority` for variants
- **Icons:** Hugeicons (`@hugeicons/react` + `@hugeicons/core-free-icons`)
- **Styling:** Tailwind CSS v4 with PostCSS, `tw-animate-css` for animations, `tailwind-merge` + `clsx` via `cn()` helper in `lib/utils.ts`
- **Path alias:** `@/*` maps to project root

## Adding shadcn Components

```bash
bunx shadcn@latest add <component-name>
```

Components go to `components/ui/`. The shadcn config (`components.json`) uses RSC-compatible output, Hugeicons as the icon library, and neutral as the base color.
