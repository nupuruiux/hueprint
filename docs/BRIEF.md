# Project Brief: Image → UI Theme (Hueprint)

## Overview

**Hueprint** (working name) turns any painting, or any image you upload, into an accessible UI theme you can ship: colour roles, light and dark modes, and contrast-checked tokens, exported to CSS, Tailwind or Figma.

- **Pitch:** "Any image → a UI theme you can actually ship."
- **Why this project:** it puts my design-systems work (tokens, roles, accessibility) into a product of my own, and gives me real practice with Git/GitHub, a database and public APIs.
- **Target roles it supports:** B2B SaaS, consumer apps, early-stage startups that value designers who build.
- **Time box:** 4 weekends for the MVP, then a case study.

## Problem & opportunity

Palette tools stop at swatches; nobody answers "will these colours work as a UI?"

- Tools like Coolors and Adobe Color pull 5–6 colours from an image, but don't say which is a background, which is text, or which is a button.
- Colours taken from photos often fail WCAG contrast once used as text or buttons.
- Dark mode is an afterthought: users have to rebuild the palette by hand.
- Turning swatches into code or Figma variables is manual, repetitive work.

**Opportunity:** close the gap between inspiration and a working theme.

## Target users

| User | Job to be done | What they need from Hueprint |
| --- | --- | --- |
| Indie developer / founder | "Give my side project a look that isn't default blue." | One-click theme + Tailwind/CSS export |
| Product designer | "Start a moodboard-driven exploration fast." | Figma variables export, role editing |
| Brand / visual designer | "Check if brand imagery can become a usable UI palette." | Contrast report, light + dark preview |
| Painter / hobbyist (secondary) | "See my artwork as a living interface." | Upload, share link, gallery |

Primary user for the MVP: **indie developers and product designers**.

## Scope

The MVP ships one complete loop: painting (or upload) in → theme previewed → theme exported and shared.

> **Scope change (Oct 2026):** the museum gallery is now the main way in, uploading is second, and Unsplash comes later. The MVP is **frontend only**: theme state lives in the URL so every result can be shared, and the database (sign-in, saved themes) moves to after the MVP. Detailed build spec: `docs/FRONTEND_PROMPT.md`.

| Feature | MVP | Later | Out of scope |
| --- | --- | --- | --- |
| Museum painting gallery (Art Institute of Chicago), filter by movement + mood | ✓ | | |
| Upload your own image | ✓ | | |
| Search Unsplash photos | | ✓ | |
| Extract 6–8 main colours | ✓ | | |
| Three directions per image: Faithful, Soft, Bold | ✓ | | |
| Auto-assign roles (primary, surface, text, border, states) | ✓ | | |
| Auto-fix contrast to WCAG AA | ✓ | | |
| Light + dark mode | ✓ | | |
| Live preview on a sample dashboard + mobile screen | ✓ | | |
| Manually swap or lock a role's colour | ✓ | | |
| Export CSS variables + Tailwind config | ✓ | | |
| Export design tokens JSON (W3C format, imports to Figma via Tokens Studio) | ✓ | | |
| Share link (theme state in the URL) | ✓ | | |
| Sign in + save themes | | ✓ | |
| Public gallery of user themes | | ✓ | |
| Paint mixing notes for painters | | ✓ | |
| Full component library generation | | | ✓ |
| AI-generated images | | | ✓ |

## Core flows and screens

The theme page is the heart of the product; every other screen feeds into it or out of it. No sign-in anywhere in the MVP: export is free and immediate.

```
[Painting gallery] ─┐                                       ┌──► [Export: CSS, Tailwind, JSON]
                    ├──► [Theme page /theme/[id]] ──────────┤
[Upload an image] ──┘     choose Faithful / Soft / Bold     └──► [Copy share link]
                          roles auto-assigned, fixed to AA
                          light + dark, live preview
                          swap or lock any role ──► "Try another painting" loops back
```

**Screens to design:** landing page (hero, gallery, upload drop zone, how it works) · theme page with options, tokens and preview · export panel · loading, low-colour, bad-upload and 404 states.

## Theme generation logic

All of this runs in the browser; no server or AI is needed. Work in the **OKLCH** colour space so lightness changes look even to the eye.

1. **Extract.** Shrink the image, read its pixels on a canvas, and pull 6–8 main colours with `node-vibrant` (it also labels them as Vibrant, Muted, DarkMuted and so on).
2. **Pick the brand colour.** Choose the most saturated colour that covers a decent part of the image → `primary`.
3. **Build the neutrals.** Take the dominant colour, lower its chroma to near grey, and make a light-to-dark scale → `background`, `surface`, `border`, `text`, `text-muted`.
4. **Assign the remaining roles.** `secondary` / `accent` from the next-best colours; `success`, `warning`, `danger` from fixed hues, tinted toward the image's colours so they belong.
5. **Make states.** Hover = primary 8% darker; pressed = 14% darker; disabled = primary at low chroma.
6. **Fix contrast.** For each pair that must be readable (text on background, text on primary, etc.), check the WCAG ratio. If it fails, nudge lightness step by step until it passes 4.5:1 (text) or 3:1 (large text, borders). Show the user what moved.
7. **Dark mode.** Flip the neutral scale, lower primary's lightness and chroma slightly, and re-run step 6.
8. **Let the user steer.** Any role can be swapped for another extracted colour or locked; unlocked roles regenerate around it.

Libraries: `node-vibrant` (extraction), `culori` (OKLCH maths + WCAG contrast).

## Data model (after the MVP)

The MVP has no database: paintings come from `data/paintings.json` and theme state lives in the URL. When sign-in and saved themes arrive, this is the plan. Four tables in Supabase (Postgres). Auth users come free with Supabase Auth; uploaded files live in a Supabase Storage bucket called `images`.

| Table | Key fields | Notes |
| --- | --- | --- |
| `profiles` | `id` (= auth user id), `display_name`, `created_at` | One row per signed-in user |
| `source_images` | `id`, `user_id`, `source` (upload / unsplash / museum), `storage_path` or `external_url`, `credit`, `extracted_colors` (JSON list of hex), `created_at` | Unsplash requires crediting the photographer, so `credit` is mandatory for API images |
| `themes` | `id`, `user_id`, `image_id`, `name`, `light` (JSON role → colour), `dark` (JSON role → colour), `locked_roles` (list), `is_public`, `created_at`, `updated_at` | Roles stored as JSON keeps the schema simple |
| `exports` | `id`, `theme_id`, `format` (css / tailwind / figma), `created_at` | Basic analytics |

**Row Level Security:** on for every table; users can only read and edit their own rows, and anyone can read themes where `is_public` is true.

## APIs and tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js (React, App Router) + TypeScript |
| Styling | Tailwind CSS |
| Artwork API | Art Institute of Chicago API (no key) — https://api.artic.edu/docs/. Fetched once by `scripts/fetch-paintings.ts`; images are saved to `public/paintings/` because AIC's image server refuses requests without an `AIC-User-Agent` header, which browsers can't send |
| Image search API (later) | Unsplash API (free key) — https://unsplash.com/developers |
| Colour | `node-vibrant`, `culori` |
| Animation | Framer Motion |
| Database, auth, storage (later) | Supabase |
| Hosting | Vercel, connected to GitHub |

**When Unsplash arrives, keep its key secret.** Call Unsplash from a Next.js server route (`/api/unsplash`) that reads the key from an environment variable. Never put it in browser code or commit it; `.env.local` is in `.gitignore` from day one. Cache search results to stay under Unsplash's demo rate limit.

## Git/GitHub workflow and milestones

Every feature gets an issue, a branch and a pull request.

1. Create a GitHub Issue describing the feature (e.g. "Upload image").
2. Make a branch: `git checkout -b feat/upload-image`.
3. Commit small and often: `feat: add drag-and-drop upload`.
4. Push and open a PR; Vercel posts a preview link on it.
5. Check the preview, then merge into `main`; the live site updates automatically.

**Weekend 1: Foundations**
- [x] Create the GitHub repo, Next.js app, Tailwind, `.gitignore`
- [x] Connect Vercel and get a live URL
- [x] Fonts, site design tokens, layout shell, painting data (`scripts/fetch-paintings.ts` → `data/paintings.json`)

**Weekend 2: Gallery and theme engine**
- [x] Landing page: hero, swatch marquee, filters, gallery with hover/tap states
- [x] Theme engine in `lib/theme/` + unit tests (Vitest)
- [x] Theme page: painting header, Faithful / Soft / Bold options, token system with light/dark, lock, swap, copy

**Weekend 3: Preview, export, upload**
- [x] Live dashboard + mobile preview
- [x] Export panel (CSS, Tailwind, JSON) + share link
- [x] Upload flow

**Weekend 4: Polish and ship**
- [x] Loading, empty, error and 404 states; reduced motion; accessibility pass; Lighthouse 90+
- [x] Typography pass: Newsreader (primary, editorial) + Geist (secondary, UI), with Geist Mono for hex codes and code
- [x] Logo: "hueprint." wordmark in Newsreader semibold
- [x] README with screenshots, a short demo GIF and setup steps
- [ ] Write the case study

**After the MVP**
- [ ] Supabase project, tables, Row Level Security
- [ ] Sign in with email magic link; save themes; "My themes" page
- [ ] Unsplash search via a server route

## Definition of done

- [x] Live URL anyone can try without signing up
- [x] Every generated theme passes WCAG AA for text by default
- [ ] Five real people tried it
- [ ] Repo has a clean README and at least 10 merged PRs
