# Project Brief: Image → UI Theme (Hueprint)

## Overview

**Hueprint** (working name) turns any image into an accessible UI theme you can ship: colour roles, light and dark modes, and contrast-checked tokens, exported to CSS, Tailwind or Figma.

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

The MVP ships one complete loop: image in → theme previewed → theme saved and exported.

| Feature | MVP | Later | Out of scope |
| --- | --- | --- | --- |
| Upload your own image | ✓ | | |
| Search Unsplash photos | ✓ | | |
| Pick from museum artworks (Art Institute of Chicago) | | ✓ | |
| Extract 6–8 main colours | ✓ | | |
| Auto-assign roles (primary, surface, text, border, states) | ✓ | | |
| Auto-fix contrast to WCAG AA | ✓ | | |
| Light + dark mode | ✓ | | |
| Live preview on a sample dashboard + mobile card | ✓ | | |
| Manually swap or lock a role's colour | ✓ | | |
| Export CSS variables + Tailwind config | ✓ | | |
| Export Figma variables JSON | | ✓ | |
| Sign in + save themes | ✓ | | |
| Public share link + gallery | | ✓ | |
| Paint mixing notes for painters | | ✓ | |
| Full component library generation | | | ✓ |
| AI-generated images | | | ✓ |

## Core flows and screens

The theme editor is the heart of the product; every other screen feeds into it or out of it. Export works without signing in, which keeps the first try friction-free.

```
[Upload an image] ─┐
[Search Unsplash] ─┼──► [Theme editor] ──► [Save theme (sign in if needed)] ──► [My themes]
[Museum art (later)]┘    roles auto-assigned          │                              │
                         contrast fixed to AA         └──────► [Export: CSS, Tailwind] ◄┘
                         light + dark preview
                         swap or lock any role
```

**Screens to design:** landing page with a "try it" drop zone · source picker (upload / Unsplash) · theme editor with preview · export modal · sign-in · My themes list · empty, loading and error states for each.

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

## Data model

Four tables in Supabase (Postgres). Auth users come free with Supabase Auth; uploaded files live in a Supabase Storage bucket called `images`.

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
| Image search API | Unsplash API (free key) — https://unsplash.com/developers |
| Artwork API (later) | Art Institute of Chicago API (no key) — https://api.artic.edu/docs/ |
| Colour | `node-vibrant`, `culori` |
| Database, auth, storage | Supabase |
| Hosting | Vercel, connected to GitHub |

**Keep the Unsplash key secret.** Call Unsplash from a Next.js server route (`/api/unsplash`) that reads the key from an environment variable. Never put it in browser code or commit it; `.env.local` is in `.gitignore` from day one. Cache search results to stay under Unsplash's demo rate limit.

## Git/GitHub workflow and milestones

Every feature gets an issue, a branch and a pull request.

1. Create a GitHub Issue describing the feature (e.g. "Upload image").
2. Make a branch: `git checkout -b feat/upload-image`.
3. Commit small and often: `feat: add drag-and-drop upload`.
4. Push and open a PR; Vercel posts a preview link on it.
5. Check the preview, then merge into `main`; the live site updates automatically.

**Weekend 1: Foundations**
- [x] Create the GitHub repo, Next.js app, Tailwind, `.gitignore`
- [ ] Connect Vercel and get a live URL
- [ ] Upload an image and show its extracted colours

**Weekend 2: The theme engine**
- [ ] Role mapping, contrast fixing, dark mode
- [ ] Live preview on the sample dashboard + mobile card
- [ ] Swap and lock roles

**Weekend 3: Data and APIs**
- [ ] Supabase project, tables, Row Level Security
- [ ] Sign in with email magic link
- [ ] Save themes; "My themes" page
- [ ] Unsplash search via a server route

**Weekend 4: Polish and ship**
- [ ] CSS + Tailwind export
- [ ] Empty, loading and error states; mobile layout
- [ ] README with screenshots, a short demo GIF and setup steps
- [ ] Write the case study

## Definition of done

- [ ] Live URL anyone can try without signing up (sign-in only to save)
- [ ] Every generated theme passes WCAG AA for text by default
- [ ] Five real people tried it
- [ ] Repo has a clean README and at least 10 merged PRs
