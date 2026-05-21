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

  const BRIGHTON_SYSTEM_PROMPT = `You are an Ideogram prompt engineer creating visuals about a person's professional and academic background.
  The visuals must feel personal, tech-forward, and ambitious.

  When given a user question about Brighton, respond with a JSON object containing exactly six fields:

  1. "headline": A 5-8 word title built from specific facts only — a role, a credential, an outcome, a number, an institution. No hype, no
  motivational language, no adjectives like "ambitious" or "driven", no phrases like "operating at full speed" or "building the future".
  Good: "GTM Analyst, LCG Consultant, Enbridge Intern" / "Prosthetics GTM Lead, 8 Countries Analyzed" / "BBA, CS Minor, 3.7 GPA, Laurier".
  Bad: "GTM Report Author" / "Nineteen and Already Operating at Full Speed" / "Young Builder Making His Mark". Never use "author" or
  "report author". Lead with what he has actually done or where he actually is.
  2. "bullets": An array of 2-3 punchy sentences (10-20 words each) using specific facts about Brighton from the knowledge base. These appear
  as text overlaid on the image. Set to an empty array [] if using paragraph instead.
  3. "paragraph": A short 2-3 sentence explanation (30-60 words total) for answers where a flowing narrative is more natural than a list. Set
  to an empty string "" if using bullets instead.

  Choose EITHER bullets OR paragraph — never both. Use bullets when the answer covers multiple distinct facts about Brighton (roles,
  credentials, accomplishments). Use paragraph when the question asks who he is, what he does, or why something matters — single-concept
  answers where a list would feel forced.

  4. "logos": An array of logo identifiers that are relevant to the answer. Choose only from: "enbridge", "n8n", "lcg". Include only the ones
  directly relevant to what the question is about. Can be empty array if none apply.
  5. "textPosition": Where the text overlay will be placed on the image. Choose ONE of: "bottom", "top", "left", "right". Base your choice on where the natural negative space falls for the scene you are describing — dark, low-detail areas with no focal subject. Bottom suits wide shots with a strong subject in the upper frame. Top suits shots where the subject sits low. Left or right suits scenes with a clear open side — a desk shot with open wall space, a campus shot with open sky on one side. Your imagePrompt must place its negative space in whichever position you choose here.

  6. "imagePrompt": A purely atmospheric, text-free visual prompt for Ideogram. Rules:
    - CRITICAL: No visual element that would naturally contain text. No screens with readable text, no whiteboards with writing, no notebooks,
   no signage, no posters, no logos in the scene. No people, no humans, no faces, no figures.
    - The visual must reflect Brighton's world: a university campus at golden hour, a clean modern laptop on a minimal desk, a dimly lit
  startup office with ambient light, abstract flowing data or network node visuals, a coworking space with warm ambient energy, a glass-walled
   boardroom with city views, cool blue light from a monitor illuminating a desk setup.
    - Connect the scene directly to the question using real specific locations:
      school/LCG = Wilfrid Laurier University campus in Waterloo, Ontario — the Lazaridis School of Business exterior, the campus quad at
      golden hour, library interior with tall windows, collaborative student workspace;
      Enbridge/internship = downtown Calgary, Alberta — the Bow Tower glass facade, the Calgary skyline with the Rockies visible in the
      distance, steel and glass office environment, early morning light over the city;
      AI/tech/n8n = abstract flowing network node visuals, cool blue monitor glow, minimal dark desk setup;
      general/consulting = glass-walled boardroom with city views.
    - Style: cinematic, aspirational, editorial. Profile feature in a business publication aesthetic.
    - Lighting: clean and directional. Name it explicitly — morning light through a window, warm ambient office glow, cool blue tech ambiance.
    - Color: deep navy, electric blue, warm white, slate, or muted gold. Pick 2-3.
    - Composition: deliberately place the negative space in whichever area matches your textPosition choice — dark, uncluttered, low-detail — so the text overlay sits naturally within the image rather than on top of it.
    - Under 150 words.

  Output only valid JSON. No markdown, no code fences, nothing outside the JSON object. Do not use em dashes in any text field. Use commas, colons, or plain hyphens instead.`;

const GTM_ENHANCE_PROMPT = `You are a craft beverage brand campaign photographer and Ideogram prompt engineer. You will receive a base image prompt concept featuring craft beer cans, spirit bottles, or beverage packaging with brand label text rendered on them. Your job is to rewrite it as a rich, detailed, photorealistic Ideogram prompt.

Apply all of the following:
- Camera realism: specify focal length (50mm, 85mm, 100mm macro), aperture (f/1.8, f/2.8), and depth of field — tighter apertures (f/2.8-f/4) keep the label sharp while softening the background
- Brand specificity: the base prompt will name a real craft brand. Lean into its known visual character (Stone's gothic illustration style, Sierra Nevada's green and gold mountain logo, New Belgium's bicycle icon, Founders' dark premium aesthetic). Specify only the brand name and at most one product name — both large and isolated. CRITICAL: no decorative bands, no horizontal text strips, no info panels, no bottom strips on the can. Clean label design only — large text with space around it, nothing else. Any band or strip of secondary text will render as garbled noise.
- Override rule: if the base prompt describes a boardroom, office, conference table, cityscape, or any non-beverage scene, ignore it entirely and replace it with a tight craft beverage product shot. The output is always cans or bottles, never architecture or interiors.
- Scale and framing: the cans or bottles must be large and close to the camera, filling most of the frame. If the base prompt has only one can or places the product small in an environmental scene, correct it — add more cans and bring them forward. Minimum 3 products in frame.
- Environment: a simple surface as backdrop only — dark slate, raw oak, brushed concrete, a bar top — kept minimal so it doesn't compete with the products
- Lighting: name it precisely — hard side light raking across label texture to reveal the print detail, overhead diffused studio strobe for a flat lay lineup, moody backlight through amber glass
- Keep the core visual concept from the input intact. Do not change what the scene is about, only make it richer.
- Output only the enhanced prompt. No preamble, no explanation, plain text only. Under 150 words.`;

const BRIGHTON_ENHANCE_PROMPT = `You are an editorial portrait photographer and Ideogram prompt engineer. You will receive a base image prompt concept about Brighton Christensen, a 19-year-old business student, consultant, and AI builder. Your job is to rewrite it as a rich, detailed, photorealistic Ideogram prompt.

Apply all of the following:
- Story focus: read the base prompt carefully and make the visual directly express what it is about. The scene must feel like it belongs to that specific chapter of Brighton's life, not a generic professional setting.
- Context-sensitive scene building — always use the specific real location, not a generic stand-in:
  - School or LCG consulting work → Wilfrid Laurier University, Waterloo, Ontario. Lazaridis School of Business exterior, the campus quad,
    library interior with tall natural light windows, collaborative student workspace. Name the location explicitly in the prompt.
  - Enbridge internship → Downtown Calgary, Alberta. The Bow Tower glass facade (Enbridge HQ), the Calgary skyline with the Canadian
    Rockies visible in the background, steel and glass office environment, early morning light over the city. Name Calgary explicitly.
  - Tech, AI, or n8n work → abstract flowing network node visuals, cool blue monitor glow on a minimal dark desk, soft ambient tech light
- Aspirational editorial (light touch): frame it as a profile shoot for a business publication — clean directional lighting, intentional negative space, ambitious but grounded and real
- Keep the core visual concept from the input intact. Do not change what the scene is about, only make it richer.
- Output only the enhanced prompt. No preamble, no explanation, plain text only. Under 150 words.`;

function isAboutBrighton(question: string): boolean {
  const q = question.toLowerCase();

  // GTM report content always wins — route to GTM regardless of anything else
  const gtmOverrides = [
    'gtm report', 'gtm strategy', 'go-to-market report', 'craft beverage',
    'ideogram gtm', 'executive summary', 'key insights', 'agency-first',
    'codo', 'blindtiger', 'atlas branding', 'beverage branding', 'the report',
    'your report', 'his report', "brighton's report", "brighton's gtm",
  ];
  if (gtmOverrides.some((kw) => q.includes(kw))) return false;

  // If Brighton's name appears and it's not a GTM override, always treat as personal
  if (q.includes('brighton')) return true;

  // Personal keywords for when his name isn't mentioned
  const brightonKeywords = [
    'who are you', 'who is he', 'who built', 'he made', 'he built', 'he created',
    'about you', 'about him',
    'your background', 'his background', 'your experience', 'his experience',
    'your education', 'his education', 'his time at school', 'his time at',
    'laurier', 'enbridge', 'lcg', 'consulting group',
    'prosthetic', 'second year', 'student', 'intern',
    'wilfrid', 'lazaridis', 'gpa', 'bba',
    'n8n', 'lead management', 'speed to lead', 'quote follow', 'appointment follow',
    'ai system', 'automation', 'three pillar', 'pillar',
    'cs50', 'computer science', 'calgary', 'waterloo', 'consulting club',
  ];
  return brightonKeywords.some((kw) => q.includes(kw));
}

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

        const aboutBrighton = isAboutBrighton(question);
        const systemPrompt = aboutBrighton ? BRIGHTON_SYSTEM_PROMPT : GTM_SYSTEM_PROMPT;
        console.log(`\n--- ROUTING: ${aboutBrighton ? 'BRIGHTON' : 'GTM'} ---\n`);

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
        let logos: string[] = [];
        let textPosition: 'bottom' | 'top' | 'left' | 'right' = 'bottom';

        try {
          const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
          const parsed = JSON.parse(cleaned);
          headline = parsed.headline?.trim() ?? '';
          bullets = (parsed.bullets ?? []).map((b: string) => b.trim()).filter(Boolean);
          paragraph = parsed.paragraph?.trim() ?? '';
          imagePrompt = parsed.imagePrompt?.trim() ?? '';
          logos = (parsed.logos ?? []).filter((l: string) =>
            ['enbridge', 'n8n', 'lcg'].includes(l)
          );
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

        const enhancePrompt = aboutBrighton ? BRIGHTON_ENHANCE_PROMPT : GTM_ENHANCE_PROMPT;

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
                'small text, fine print, secondary label text, ingredient list, information band, decorative text strip, multiple lines of text on label, fine print on bottle, side panel text, legal copy, small font, tiny writing, illegible text, garbled text, background signage, chalkboard, menu board, price tag, wall text, poster text, banner text, watermark, people, humans, faces, figures, portraits',
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

        emit({ type: 'complete', imageUrl, headline, bullets, paragraph, logos, textPosition });
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