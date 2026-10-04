# Prompt for Claude Code: build the Hueprint frontend

> Paste everything below the line into Claude Code, from the `hueprint` folder (with `CLAUDE.md` and `docs/BRIEF.md` already in it).
> `docs/inspo/` already holds the two hero screenshots (winter26-hero.png, spring26-hero.png). Add more if you want Claude Code to see other sections.

---

Read `CLAUDE.md`, `docs/BRIEF.md`, and the screenshots in `docs/inspo/`. Then build the **frontend** of Hueprint: a gallery of paintings where any painting (or an uploaded image) becomes a usable UI theme.

**This is frontend only.** No Supabase and no sign-in yet. Theme state lives in the URL, so every result can be shared. We add the database in a later milestone.

**Scope change from the brief:** the museum gallery is now the main entry point. Uploading is the second way in, and Unsplash comes later.

Work in the order under "Build order" at the bottom. After each step: stop, tell me how to check it in the browser, and suggest a branch name and commit message.

## 1. Look and feel

The look should be artsy, fun and editorial, like a modern art-museum magazine that happens to be a dev tool. Study the screenshots in `docs/inspo/` and borrow these specific moves, without copying the assets:

**From Winter '26 (the "Renaissance Edition"):** this is the main reference.

- **Anachronistic collage:** a full-bleed classical oil painting, remixed with modern objects in one hot pop colour (their figures hold a pink coffee cup and shopping bags and ride a skateboard). **Our twist: classical paintings remixed with UI objects.** Float 3–5 cut-out UI elements over the hero painting as if the figures were using them: a primary button, a toggle, a colour swatch chip, a cursor arrow, a contrast badge ("AA ✓"). Build them in real HTML/CSS, coloured with the theme generated from that painting, with a slight drop shadow and a gentle float/parallax on scroll.
- **A hairline frame card** centred over the painting: a 1px white border, a transparent fill, and the content inside it.
- **Mixed-type headline:** a bold condensed grotesk with one word or syllable swapped into an italic serif (theirs: "Ren*ai*ssance"). Ours could be "Every painting is a *design system*", or the logo itself as "Hue*print*".
- **A category index inside the frame:** a stacked list of movements in bold grotesk with right-aligned Roman numerals (I, II, III…). It doubles as navigation and jumps to that category in the gallery.
- **One serif line of subcopy** above the index (theirs: "A new world of commerce. 150+ product updates.").
- **Faint hairline grid lines** across the hero.
- **A transparent top nav** over the image, with a white pill CTA on the right.

**From Spring '26 ("Everywhere"):** use for motion only.

- **The pointillist particle look:** the image is made of thousands of coloured dots. Use it for the **"mixing paint" moment** on the theme page: the painting dissolves into particles that regroup into the swatch row. Build it with canvas, and keep it under about 1.5 s.
- **Curved type:** text wrapped around a ring. Optional; at most one use, e.g. "Faithful · Soft · Bold" circling the option tiles.
- **Underlined text links in neat columns** for the footer index.

**Our own brand, not Shopify's:**

- **The hero runs full-bleed and dark** (the painting). Everything below it sits on warm paper (see below), so the gallery feels like turning to the inside pages of a magazine.
- **The site's accent comes from the hero painting itself:** the floating UI objects and the hero CTA use that painting's generated `primary`, so the site demonstrates the product. Rotate the hero painting on each visit, choosing from 4–5 hand-picked works with strong figures (Old Masters or Renaissance-style portraits from the AIC data).

- **Background:** warm paper or cream (around `#F6F1EA`), not stark white. Ink text is near-black with a warm tint.
- **Accent:** burgundy or rosewood (around `#7A1F3D`, with a lighter rosewood around `#B5677D`). Never use orange-reds.
- **Type:** an expressive editorial serif for display (e.g. "Instrument Serif" or "Fraunces", from Google Fonts), paired with a clean grotesk for UI (e.g. "Inter Tight" or "Geist"). Put headlines in huge, tight-leading serif, sometimes italic.
- **Fun details (use 3–4 at most, done well):**
  - small sticker-style labels ("NEW", "TRY ME") at slight rotations
  - cards that tilt 1–2° on hover
  - a slow marquee of colour swatches under the hero
  - a soft "paint blob" that follows the cursor over the hero only
  - a grain/paper texture overlay at very low opacity
- **Motion:** smooth and short, 200–400 ms ease-out. Respect `prefers-reduced-motion` by turning off the marquee, tilt and cursor blob.
- **Chrome stays quiet so the paintings stay loud.** UI colour is mostly ink + paper + one accent.

## 2. Data: paintings

- Use the **Art Institute of Chicago API** (no key needed): https://api.artic.edu/docs/
- For speed and reliability, write a script, `scripts/fetch-paintings.ts`, that pulls about **36 public-domain paintings** (`is_public_domain=true`, `artwork_type_title=Painting`) and saves them to `data/paintings.json`. Include `id`, `title`, `artist_title`, `date_display`, `style_title`, `image_id`, plus a `credit` line. The app reads this JSON; it doesn't call the API on every page load.
- Image URLs use the IIIF format: `https://www.artic.edu/iiif/2/{image_id}/full/843,/0/default.jpg`. Use smaller sizes for thumbnails.
- **Categories** come from `style_title`, grouped into about 5–6 movements (e.g. Impressionism, Post-Impressionism, Modern, Japanese prints, Old Masters, Abstract). Choose the 6 best-represented ones; the exact names depend on what the API returns.
- **Second filter, "by mood":** Warm, Cool, Muted, Vivid. Work these out from each painting's extracted colours at build time.
- Always show the artist, title, date and "Art Institute of Chicago" credit wherever a painting appears.

## 3. Pages and flow

### A. Landing / gallery (`/`)

1. **Hero (Renaissance-collage style, see section 1):**
   - a full-bleed painting with floating UI cut-outs
   - a centred hairline frame holding the mixed-type headline, one serif line of subcopy, and the Roman-numeral movement index
   - two CTAs under the index:
     - primary, a pill in the painting's generated `primary`: **"Generate from this painting"** (opens that painting's theme page)
     - secondary, a text link: **"or upload your own"** (opens the upload drop zone)
   - a small credit line in the bottom corner (title, artist, AIC)
   - on mobile: the painting crops to the main figure, the frame goes full-width, and only 2 UI cut-outs show
2. **Swatch marquee** under the hero, made of real colours from the gallery.
3. **Sticky filter bar:** movement chips + mood chips + a **"Surprise me"** button that opens a random painting's theme.
4. **Gallery:** a masonry grid, so paintings keep their real aspect ratios.
   - **Hover (desktop):** the image lifts slightly, a 5-swatch strip of its colours slides up from the bottom, and a **"Generate palette →"** button appears.
   - **Touch devices:** no hover exists, so always show a small swatch strip, and the whole card is tappable.
   - Clicking goes to `/theme/[paintingId]`.
5. **Upload section (also reachable from the hero CTA):** a large drop zone ("Drop any image — a photo, a screenshot, your own painting"). It also accepts click-to-browse and pasting from the clipboard.
   - Read the image locally in the browser; no upload to a server yet.
   - Route to `/theme/upload`, passing the image via an object URL held in app state.
   - Accept JPG, PNG and WebP up to 10 MB. Give a friendly error for anything else.
6. **"How it works":** three short steps with small visuals (Pick → Choose a direction → Export).
7. **Footer:** credits, a GitHub repo link, and "Made by Nupur".

### B. Theme page (`/theme/[id]`)

One long page, top to bottom:

1. **Painting header:** the painting displayed large, with title, artist, date and credit beside it on desktop or below it on mobile. Include a "← Back to gallery" link.
2. **"Choose a direction": 3 option tiles in a row.** Each tile shows a mini swatch row plus a tiny button and card preview in that theme.
   - **Faithful:** colours as close to the painting as possible, contrast-fixed.
   - **Soft:** lower chroma, airy surfaces, calm.
   - **Bold:** highest-saturation primary, darker surfaces, strongest contrast.

   **Faithful is selected by default.** Selecting a tile updates everything below instantly and updates the URL (`?v=soft`).
3. **Token system** for the selected option, in two layers:
   - **Primitives:** 2–3 colour scales (50–900) generated from the painting, plus a neutral scale.
   - **Semantic roles:** `background`, `surface`, `surface-raised`, `border`, `text`, `text-muted`, `primary`, `primary-hover`, `on-primary`, `secondary`, `accent`, `success`, `warning`, `danger`, `focus-ring`.

   Each role is a row showing:
   - a swatch, the token name, the hex value, and the primitive it points to
   - a **contrast badge** against its pair (e.g. "text on background 7.2:1 AAA")
   - **click to copy** the hex
   - a **lock** icon, so you can lock a role and regenerate the others around it
   - a **swap** control, opening a popover with the other extracted colours to choose from

   Add a **Light / Dark toggle** for the whole page section, and a small **"What we fixed"** note listing any colours the contrast fixer adjusted (e.g. "Darkened text-muted from #8A7F86 to #6E636A to pass AA").
4. **Live preview:** a desktop dashboard and a mobile screen side by side (stacked on small screens), both themed with CSS variables. Clicking anywhere on them must not navigate.
   - **Desktop dashboard:** a sidebar nav with an active item, a top bar with search, 4 KPI cards, a simple line or bar chart drawn in theme colours, a data table with status badges (success, warning, danger), primary and secondary buttons, and a form input with a focus state.
   - **Mobile:** a header, a list of cards, one primary button and a bottom tab bar.
   - The previews follow the Light/Dark toggle.
5. **Export:** a sticky bar at the bottom of the viewport once the user scrolls past the option tiles, holding "Export theme", a theme name and the current option. It opens a panel with tabs:
   - **CSS variables:** `:root { --color-primary: …; }` plus a `[data-theme="dark"]` block
   - **Tailwind:** a `theme.extend.colors` snippet
   - **JSON:** W3C Design Tokens format, so it can be imported into Figma via Tokens Studio

   Each tab gets **Copy** and **Download** buttons. Also include **"Copy share link"**.
6. **Loop back:** at the very bottom, "Try another painting" with 4 suggested paintings from the same movement.

### C. States to design (don't skip these)

- **Loading:** colour extraction takes a moment. Show a playful "mixing paint…" animation (swatches swirling into place), not a plain spinner.
- **Low-colour images** (black-and-white photos, near-monochrome paintings): still produce a theme, using neutrals + one accent. Show a gentle note: "This one's mostly monochrome, so we leaned on a single accent."
- **Bad upload:** wrong format or too large → an inline error in the drop zone, not a popup.
- **Unknown painting id** → a 404 page in the same editorial style, with "Surprise me".
- **Upload page refreshed** (the image is gone) → a friendly message and the drop zone again.

## 4. Theme engine (`lib/theme/`)

Write the engine as pure, testable TypeScript functions, kept separate from the UI. Follow the logic in `docs/BRIEF.md` → "Theme generation logic":

- `extractColors(image) → Swatch[]` uses `node-vibrant`, plus chroma/lightness/coverage for each swatch.
- `buildOptions(swatches) → { faithful, soft, bold }`
- `buildTheme(swatches, strategy, locks) → { primitives, light, dark, fixes[] }`
- `fixContrast(pairs) → { adjusted, fixes[] }` uses `culori` in OKLCH and nudges lightness until WCAG AA passes.
- `toCSS / toTailwind / toDTCG (theme)` produce the export formats.
- Add unit tests (Vitest) for contrast fixing and the exporters.

## 5. Technical requirements

- Next.js (App Router) + TypeScript + Tailwind. Framer Motion for animation.
- Lazy-load gallery images and use `next/image` with AIC's IIIF domain allowed.
- The site's own design tokens live in `app/globals.css` as CSS variables. The preview components read **only** the generated theme variables, scoped to their container, so the site's UI never changes colour when a theme changes.
- **Accessibility:**
  - everything works by keyboard (the gallery cards, the option tiles as a radio group, the lock/swap controls)
  - visible focus rings
  - alt text taken from the title and artist
  - colour is never the only signal (contrast badges also say AA/AAA in text)
- **Responsive:** design mobile-first at 375 px, and check 768 px and 1440 px.
- Lighthouse: aim for 90+ on Performance and Accessibility.

## 6. Build order (stop after each step)

1. Project setup, fonts, the site's design tokens, a layout shell, `scripts/fetch-paintings.ts` and `data/paintings.json`.
2. Landing page: hero, marquee, filters and gallery with hover/tap states.
3. Theme engine in `lib/theme/` + tests.
4. Theme page: painting header + 3 option tiles + token system with Light/Dark, lock, swap and copy.
5. Live dashboard + mobile preview.
6. Export panel + share link.
7. The upload flow.
8. Loading, empty, error and 404 states; reduced motion; an accessibility pass; Lighthouse.
9. README with screenshots and a demo GIF.

## 7. Why the design works this way (keep these intentions while building)

- **Default to Faithful** (default bias, Hick's law): people pick fast from 3 options and stick with the default. More options would stall them.
- **Show the swatch strip on hover before the click** (aha moment, curiosity): users see value before committing, so the click feels like a reward rather than a gamble.
- **"What we fixed" note** (feedback loop, trust): the tool shows its reasoning, which turns an invisible algorithm into visible expertise.
- **Preview in a real dashboard** (framing, aesthetic-usability effect): a theme is judged in context, not as swatches.
- **"Mixing paint" loading and the loop-back at the end** (peak-end rule): the wait becomes a delight, and the ending leads straight to the next try.
- **"Surprise me"** (variable reward): low-effort exploration that invites a second and third session.
- **Lock + regenerate** (endowment effect): once someone tweaks a theme, it feels like theirs, which makes them more likely to export it.
- **Ethics:** no fake counts, no forced sign-up before export. Export is free and immediate.
