# IdeogramAgent

A Next.js web app: user types a question → Claude reads the embedded GTM report and writes an Ideogram-optimized image prompt → Ideogram generates the image → image renders in a dark-mode chat UI. No text response — the image is the answer.

## Architecture

```
User question (chat UI)
    ↓
POST /api/generate
    ↓
Claude API  (claude-sonnet-4-6)
    reads lib/gtm-report.ts + user question
    outputs an Ideogram image prompt (no preamble)
    ↓
Ideogram API  (model: V_2, aspect: 16:9, magic_prompt: OFF)
    returns image URL
    ↓
Image rendered in chat UI (plain <img> tag)
```

## Key files

| File | Purpose |
|---|---|
| `app/page.tsx` | Chat UI — message state, form, loading shimmer |
| `app/api/generate/route.ts` | API route — calls Claude then Ideogram |
| `lib/gtm-report.ts` | Embedded GTM report (swap with real report here) |
| `app/globals.css` | Tailwind base + shimmer animation |

## Environment variables

```
ANTHROPIC_API_KEY=
IDEOGRAM_API_KEY=
```

Copy `.env.local.example` → `.env.local` and fill in both keys.

## Running locally

```bash
npm run dev   # http://localhost:3000
npm run build
npm start
```

## Swapping the GTM report

Replace the string exported from `lib/gtm-report.ts` with your actual report content. Plain text or markdown both work.

## Models

- **Claude:** `claude-sonnet-4-6` — upgrade to `claude-opus-4-7` if prompt quality needs improvement.
- **Ideogram:** `V_2` with `ASPECT_16_9`. Change `aspect_ratio` in `app/api/generate/route.ts` for different image dimensions.
- `magic_prompt_option` is set to `OFF` because Claude already enhances the prompt.

## Tech stack

- Next.js 15 (App Router), React 19, TypeScript
- Tailwind CSS v3, PostCSS, Autoprefixer
- @anthropic-ai/sdk
