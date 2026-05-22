import Anthropic from '@anthropic-ai/sdk';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { SYSTEM_PROMPT as GTM_REPORT } from '@/lib/gtm-report';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ratelimit =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(5, '24 h'),
        analytics: false,
      })
    : null;

const GTM_SYSTEM_PROMPT = `You are a GTM analyst and Ideogram prompt engineer. Every image you generate must feature craft beverage products — cans, bottles, or packaging. No exceptions. No boardrooms, no offices, no conference tables, no cityscapes, no architectural scenes. The image is always craft beverage product photography.

When given a user question, respond with a JSON object containing exactly five fields:

  1. "headline": A bold 5-8 word title that captures the core answer using a specific fact, or name from the report.
  2. "bullets": An array of 2-3 punchy sentences (10-20 words each) using specific data, agency names, dollar figures, or named strategies
  from the report. These appear as text overlaid on the image. Set to an empty array [] if using paragraph instead.
  3. "paragraph": A short 2-3 sentence explanation (30-60 words total) for answers where a flowing narrative is more natural than a list. Set
  to an empty string "" if using bullets instead.

  Choose EITHER bullets OR paragraph — never both. Use bullets when the answer is a list of distinct facts, agencies, strategies, or data
  points. Use paragraph when the question asks why, how, or what something means — single-concept explanations where a list would feel forced.

  4. "textPosition": Where the text overlay will be placed on the image. Choose ONE of: "bottom", "top", "left", "right". Base your choice on where the natural negative space falls for the scene you are describing — dark, low-detail areas with no focal subject. Bottom suits wide shots with a strong subject in the upper frame. Top suits shots where the subject sits low (liquid on a surface, barrels on a cellar floor). Left or right suits side-lit scenes with a clear open half. Your imagePrompt must place its negative space in whichever position you choose here.

  5. "imagePrompt": A visual prompt for Ideogram featuring craft beverage products with brand label text rendered on them. Rules:
    - Labels on cans and bottles SHOULD show the brand name and at most one product name — both large, bold, and isolated as the only text
  elements on the label. Large isolated text renders cleanly.
    - CRITICAL: No decorative bands, no horizontal stripes with text, no information panels, no bottom strips, no ingredient lines, no
  secondary copy strips of any kind on the can or bottle. These always render as garbled hieroglyphics. The label design must be clean —
  brand name and product name only, as large isolated elements with negative space around them, nothing else.
    - CRITICAL: The bottom of every can and bottle must be completely clean — no text, no fine print, no ABV percentage, no volume, no
  barcode, no legal copy, no ingredients, no nutrition facts. Treat the lower third of every can as a text-free zone.
    - BLOCK: background environmental text only. No chalkboards, no menus, no wall signage, no posters, no price tags, no banners. No people,
  no humans, no faces, no figures.
    - CRITICAL: The image is ALWAYS a craft beverage product shot. No boardrooms, no conference tables, no offices, no cityscapes, no
  glass buildings, no architectural scenes of any kind. If the question is about strategy, agencies, or reports — the image is still craft
  beverage cans and bottles. Always. No exceptions.
    - Always feature multiple cans or bottles — minimum 3, ideally 4-5. The products must be large, close to the camera, and fill the
  majority of the frame. Never a single small can sitting in a large environmental scene. The beverages are the subject, not the backdrop.
    - Always name a specific real brand. Examples: Stone Brewing Arrogant Bastard, Sierra Nevada Pale Ale, Dogfish Head 90 Minute IPA,
  New Belgium Fat Tire, Founders All Day IPA, Lagunitas IPA, Bell's Two Hearted Ale, Firestone Walker 805, Oskar Blues Dale's Pale Ale,
  Allagash White, Cigar City Jai Alai, Deschutes Fresh Squeezed IPA, WhistlePig Rye Whiskey, Cutwater Spirits canned cocktails. Pick the
  brand that best fits the context.
    - Connect the scene to the question: any question = a tight product shot of 3-5 real craft cans or bottles arranged together, filling
  the frame, close to the camera on a studio surface or bar top. The environment (surface, background) is secondary. The products are primary.
    - Style: craft beverage brand campaign photography. Product-forward, editorial. The kind of shot on a brand's website or in a packaging
  design portfolio.
    - Lighting: dramatic and product-specific. Name it explicitly — hard side light raking across label texture, overhead diffused studio
  light on a flat lay lineup, moody backlight through amber glass.
    - Color: deep forest green, amber, cream, copper, slate, or navy. Pick 2-3.
    - Composition: deliberately place the negative space in whichever area matches your textPosition choice — clean, uncluttered — so the
  text overlay sits naturally within the image rather than on top of it.
    - Under 150 words.

  Output only valid JSON. No markdown, no code fences, nothing outside the JSON object. Do not use em dashes in any text field. Use commas, colons, or plain hyphens instead.`;


const GTM_ENHANCE_PROMPT = `You are a craft beverage brand campaign photographer and Ideogram prompt engineer. You will receive a base image prompt concept featuring craft beer cans, spirit bottles, or beverage packaging with brand label text rendered on them. Your job is to rewrite it as a rich, detailed, photorealistic Ideogram prompt.

Apply all of the following:
- Camera realism: specify focal length (50mm, 85mm, 100mm macro), aperture (f/1.8, f/2.8), and depth of field — tighter apertures (f/2.8-f/4) keep the label sharp while softening the background
- Brand specificity: the base prompt will name a real craft brand. Lean into its known visual character (Stone's gothic illustration style, Sierra Nevada's green and gold mountain logo, New Belgium's bicycle icon, Founders' dark premium aesthetic). Specify only the brand name and at most one product name — both large and isolated. CRITICAL: no decorative bands, no horizontal text strips, no info panels, no bottom strips on the can. Clean label design only — large text with ample space around it, nothing else. Any band or strip of secondary text will render as garbled noise. No small text anywhere on the label at any size — one or two words maximum, rendered as large as possible.
- Bottom of can rule: explicitly state in the prompt that the lower third of every can is completely bare — no ABV, no volume, no barcode, no legal copy, no fine print, no ingredients. Clean metal or solid color only.
- Override rule: if the base prompt describes a boardroom, office, conference table, cityscape, or any non-beverage scene, ignore it entirely and replace it with a tight craft beverage product shot. The output is always cans or bottles, never architecture or interiors.
- Scale and framing: the cans or bottles must be large and close to the camera, filling most of the frame. If the base prompt has only one can or places the product small in an environmental scene, correct it — add more cans and bring them forward. Minimum 3 products in frame.
- Environment: a simple surface as backdrop only — dark slate, raw oak, brushed concrete, a bar top — kept minimal so it doesn't compete with the products
- Lighting: name it precisely — hard side light raking across label texture to reveal the print detail, overhead diffused studio strobe for a flat lay lineup, moody backlight through amber glass
- Keep the core visual concept from the input intact. Do not change what the scene is about, only make it richer.
- Output only the enhanced prompt. No preamble, no explanation, plain text only. Under 150 words.`;


export async function POST(request: Request) {
  if (ratelimit) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anonymous';
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return new Response(JSON.stringify({ type: 'error', error: 'rate_limited' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (data: object) =>
        controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));

      try {
        const { question } = await request.json();

        if (!question?.trim()) {
          emit({ type: 'error', error: 'Question is required' });
          return;
        }

        const systemPrompt = GTM_SYSTEM_PROMPT;

        emit({ type: 'phase', message: 'Claude - analyzing your question' });

        const claudeResponse = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: `Knowledge base:\n\n${GTM_REPORT}\n\n---\n\nUser question: "${question.trim()}"`,
            },
          ],
        });

        const raw =
          claudeResponse.content[0].type === 'text'
            ? claudeResponse.content[0].text.trim()
            : '';

        if (!raw) {
          emit({ type: 'error', error: 'Claude did not return a response' });
          return;
        }

        let imagePrompt = '';
        let headline = '';
        let bullets: string[] = [];
        let paragraph = '';
        let textPosition: 'bottom' | 'top' | 'left' | 'right' = 'bottom';

        try {
          const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
          const parsed = JSON.parse(cleaned);
          const stripEmDash = (s: string) => s.replace(/—/g, '-');
          headline = stripEmDash(parsed.headline?.trim() ?? '');
          bullets = (parsed.bullets ?? []).map((b: string) => stripEmDash(b.trim())).filter(Boolean);
          paragraph = stripEmDash(parsed.paragraph?.trim() ?? '');
          imagePrompt = parsed.imagePrompt?.trim() ?? '';
          if (['bottom', 'top', 'left', 'right'].includes(parsed.textPosition)) {
            textPosition = parsed.textPosition;
          }
        } catch {
          imagePrompt = raw;
        }

        if (!imagePrompt) {
          emit({ type: 'error', error: 'Claude did not return an image prompt' });
          return;
        }

        console.log('\n--- BASE IMAGE PROMPT ---\n', imagePrompt, '\n-------------------------\n');

        emit({ type: 'phase', message: 'Claude - enhancing image prompt' });

        const enhancePrompt = GTM_ENHANCE_PROMPT;

        const enhanceResponse = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 400,
          system: enhancePrompt,
          messages: [{ role: 'user', content: imagePrompt }],
        });

        const enhancedImagePrompt =
          enhanceResponse.content[0].type === 'text'
            ? enhanceResponse.content[0].text.trim()
            : imagePrompt;

        console.log('\n--- ENHANCED IMAGE PROMPT ---\n', enhancedImagePrompt, '\n-----------------------------\n');

        emit({ type: 'phase', message: 'Ideogram - rendering your image' });

        const almostThereTimer = setTimeout(() => {
          emit({ type: 'phase', message: 'Ideogram - almost there' });
        }, 9000);

        const ideogramResponse = await fetch('https://api.ideogram.ai/generate', {
          method: 'POST',
          headers: {
            'Api-Key': process.env.IDEOGRAM_API_KEY!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image_request: {
              prompt: enhancedImagePrompt,
              negative_prompt:
                'small text, fine print, secondary label text, ingredient list, information band, decorative text strip, multiple lines of text on label, fine print on bottle, side panel text, legal copy, small font, tiny writing, micro text, tiny font, multiple text sizes, crowded label, cluttered label, text heavy label, busy label, dense text on can, small print anywhere, illegible text, garbled text, text at bottom of can, bottom of can text, lower can text, abv text, alcohol percentage text, volume text, barcode, nutrition facts, legal disclaimer on can, ingredients list on can, background signage, chalkboard, menu board, price tag, wall text, poster text, banner text, watermark, people, humans, faces, figures, portraits',
              model: 'V_2',
              aspect_ratio: 'ASPECT_16_9',
              magic_prompt_option: 'OFF',
            },
          }),
        });

        clearTimeout(almostThereTimer);

        if (!ideogramResponse.ok) {
          const errText = await ideogramResponse.text();
          console.error('Ideogram API error:', ideogramResponse.status, errText);
          emit({ type: 'error', error: 'Image generation failed' });
          return;
        }

        const ideogramData = await ideogramResponse.json();
        const imageUrl = ideogramData.data?.[0]?.url;

        if (!imageUrl) {
          emit({ type: 'error', error: 'No image URL returned from Ideogram' });
          return;
        }

        emit({ type: 'complete', imageUrl, headline, bullets, paragraph, textPosition });
      } catch (err) {
        console.error('Generate route error:', err);
        emit({ type: 'error', error: 'Internal server error' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'application/x-ndjson' },
  });
}