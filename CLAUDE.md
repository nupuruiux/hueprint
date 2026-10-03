# Hueprint — instructions for Claude Code

Read `docs/BRIEF.md` before doing anything. It is the source of truth for scope, theme logic, data model and stack.

## Who I am
I'm a product designer learning Git/GitHub, databases and APIs through this project. Build it with me, not for me.

## How to work
- Build one milestone at a time, in the order in `docs/BRIEF.md`. Don't start the next one until I say so.
- One feature = one branch + one pull request. Suggest the branch name and commit messages (`feat:`, `fix:`, `chore:`).
- Before running any git, npm or Supabase command, say in one line what it does and why.
- After each feature, tell me how to test it in the browser, then tick it off in `docs/BRIEF.md`.
- Keep code simple and readable over clever. Add short comments where the colour logic isn't obvious.

## Rules
- Never commit secrets. API keys live in `.env.local` (git-ignored). Add every new variable name to `.env.example` with no value.
- The Unsplash key is only used in server routes (`app/api/...`), never in client components.
- Every Supabase table has Row Level Security turned on.
- Stay inside MVP scope. If something is "Later" or "Out of scope" in the brief, don't build it — note it as a GitHub issue instead.
- Theme output must pass WCAG AA (4.5:1 for text) in both light and dark mode.

## Stack
Next.js (App Router) + TypeScript · Tailwind CSS · node-vibrant · culori · Supabase (Postgres, Auth, Storage) · Vercel

## Next.js version notes
@AGENTS.md
