# The Ingredient List — Motion Framework

Next.js 15 + GSAP + Lenis + Framer Motion scroll experience.

## Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS v4
- GSAP 3 + ScrollTrigger
- Lenis (smooth scroll)
- Framer Motion 12

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy

Push to GitHub, import in Vercel. Zero config needed — Next.js is auto-detected.

## Scene architecture

| Scene | File | Scroll budget |
|-------|------|--------------|
| S1 Hero | `SceneS1.tsx` | 200vh |
| S2 Handoff | `SceneS2.tsx` | 100vh |
| S3 Capability Deck | `SceneS3.tsx` | 300vh |
| S4 Relationship Formation | `SceneS4.tsx` | 280vh |
| S5 Transformation | `SceneS5.tsx` | 200vh |
| S6 Assembly | `SceneS6.tsx` | 300vh |

## Motion system

All animation tokens live in `lib/motion/tokens.ts`.  
Lenis → GSAP ScrollTrigger bridge is in `providers/LenisProvider.tsx`.  
Never write animation values outside the token system.
