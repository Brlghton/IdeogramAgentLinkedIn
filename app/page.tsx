'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';

type TextPosition = 'bottom' | 'top' | 'left' | 'right';

type Message = {
  id: string;
  question: string;
  imageUrl?: string;
  headline?: string;
  bullets?: string[];
  paragraph?: string;
  logos?: string[];
  textPosition?: TextPosition;
  loadingPhase?: string;
  loading: boolean;
  error?: string;
};

const LOGO_MAP: Record<string, { src: string; label: string; dark?: boolean }> = {
  enbridge: { src: '/logo-header-gray.png', label: 'Enbridge' },
  n8n:      { src: '/images.png',           label: 'n8n' },
  lcg:      { src: '/images.jpg',           label: 'Laurier Consulting Group' },
};

function IdeogramLogoSmall() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/ideogram.png" alt="Ideogram" className="w-7 h-7 object-contain" />
  );
}

function IdeogramLogoLarge() {
  return (
    <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-md overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/ideogram.png" alt="Ideogram" className="w-12 h-12 object-contain" />
    </div>
  );
}

function SendIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function LoadingBubble() {
  return (
    <div className="flex justify-start">
      <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="block w-2 h-2 rounded-full bg-green-500 animate-bounce-gentle"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PhaseBubble({ phase }: { phase: string }) {
  return (
    <div className="flex justify-start">
      <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
        <div className="flex items-end gap-2.5">
          <span className="text-sm text-gray-600">{phase}</span>
          <div className="flex gap-1 shrink-0 pb-0.5">
            {[0, 120, 240].map((delay) => (
              <span
                key={delay}
                className="block w-1 h-1 rounded-full bg-green-500 animate-bounce-big"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ImageOverlay({
  headline,
  bullets,
  paragraph,
  logos,
  textPosition = 'bottom',
  size = 'lg',
}: {
  headline?: string;
  bullets?: string[];
  paragraph?: string;
  logos?: string[];
  textPosition?: TextPosition;
  size?: 'sm' | 'lg';
}) {
  if (!headline && !(bullets && bullets.length > 0) && !paragraph) return null;

  const smPos = 'bottom-0 left-0 right-0 justify-end';
  const lgPos =
    textPosition === 'top'    ? 'top-0 left-0 right-0 justify-start' :
    textPosition === 'left'   ? 'top-0 left-0 bottom-0 w-2/5 justify-end' :
    textPosition === 'right'  ? 'top-0 right-0 bottom-0 w-2/5 justify-end' :
                                'bottom-0 left-0 right-0 justify-end';

  const smGradient = 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.55) 60%, transparent 100%)';
  const lgGradient =
    textPosition === 'top'   ? 'linear-gradient(to bottom, rgba(0,0,0,0.93) 0%, rgba(0,0,0,0.7) 55%, transparent 100%)' :
    textPosition === 'left'  ? 'linear-gradient(to right,  rgba(0,0,0,0.93) 0%, rgba(0,0,0,0.7) 55%, transparent 100%)' :
    textPosition === 'right' ? 'linear-gradient(to left,   rgba(0,0,0,0.93) 0%, rgba(0,0,0,0.7) 55%, transparent 100%)' :
                                'linear-gradient(to top,    rgba(0,0,0,0.93) 0%, rgba(0,0,0,0.7) 55%, transparent 100%)';

  return (
    <div
      className={`absolute flex flex-col ${size === 'sm' ? smPos : lgPos} ${size === 'sm' ? 'px-3 py-2' : 'px-10 py-10'}`}
      style={{ background: size === 'sm' ? smGradient : lgGradient }}
    >
      {logos && logos.length > 0 && size === 'lg' && (
        <div className="flex gap-3 mb-5">
          {logos.map((key) => {
            const logo = LOGO_MAP[key];
            if (!logo) return null;
            return (
              <div key={key} className={`rounded-xl px-3 py-2 flex items-center justify-center shadow-lg overflow-hidden ${logo.dark ? 'bg-transparent border border-white/30' : 'bg-white'}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo.src} alt={logo.label} className="h-16 w-auto max-w-[140px] object-contain" />
              </div>
            );
          })}
        </div>
      )}
      {headline && (
        <p className={`text-white font-extrabold leading-tight tracking-tight drop-shadow-lg ${size === 'sm' ? 'text-[11px] mb-1' : 'text-4xl mb-5'}`}>
          {headline}
        </p>
      )}
      {bullets && bullets.length > 0 && (
        <ul className={size === 'sm' ? 'space-y-px' : 'space-y-3'}>
          {bullets.map((b, i) => (
            <li key={i} className={`text-gray-100 flex drop-shadow ${size === 'sm' ? 'text-[9px] gap-1' : 'text-xl gap-3'}`}>
              <span className={`text-white font-bold shrink-0 ${size === 'sm' ? '' : 'mt-0.5'}`}>•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
      {(!bullets || bullets.length === 0) && paragraph && (
        <p className={`text-gray-100 drop-shadow ${size === 'sm' ? 'text-[9px] leading-snug' : 'text-xl leading-relaxed'}`}>
          {paragraph}
        </p>
      )}
    </div>
  );
}

function Lightbox({
  url,
  headline,
  bullets,
  paragraph,
  logos,
  textPosition = 'bottom',
  onClose,
}: {
  url: string;
  headline?: string;
  bullets?: string[];
  paragraph?: string;
  logos?: string[];
  textPosition?: TextPosition;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-5 right-5 w-11 h-11 rounded-full bg-gray-400/70 hover:bg-gray-300/80 flex items-center justify-center text-white text-lg font-bold transition-colors"
        aria-label="Close"
      >
        ✕
      </button>

      {/* Image + text overlay container */}
      <div
        className="relative max-w-[93vw] max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt="Generated visual"
          className="block w-full h-full object-contain"
        />

        <ImageOverlay headline={headline} bullets={bullets} paragraph={paragraph} logos={logos} textPosition={textPosition} size="lg" />
      </div>
    </div>
  );
}

const WELCOME_MESSAGE = "This Agent Has Brighton's Full Go-To-Market Strategy and personal overview. Ask away!";

const CHIPS = [
  { label: 'Can I get the executive summary?', prompt: 'Executive Summary' },
  { label: 'Can you tell me a bit about Brighton?', prompt: 'About Brighton' },
  { label: 'What are the key insights?', prompt: 'Key Insights' },
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lightbox, setLightbox] = useState<{ url: string; headline?: string; bullets?: string[]; paragraph?: string; logos?: string[]; textPosition?: TextPosition } | null>(null);
  const [typedMessage, setTypedMessage] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let i = 0;
    setTypedMessage('');
    const interval = setInterval(() => {
      i++;
      setTypedMessage(WELCOME_MESSAGE.slice(0, i));
      if (i >= WELCOME_MESSAGE.length) clearInterval(interval);
    }, 22);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-open lightbox when a new image finishes generating
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.imageUrl && !last.loading) {
      setLightbox({ url: last.imageUrl, headline: last.headline, bullets: last.bullets, paragraph: last.paragraph, logos: last.logos, textPosition: last.textPosition });
    }
  }, [messages]);

  const handleSubmit = async (e: FormEvent | null, overrideQuestion?: string) => {
    e?.preventDefault();
    const question = (overrideQuestion ?? input).trim();
    if (!question || isSubmitting) return;

    const id = crypto.randomUUID();
    setInput('');
    setIsSubmitting(true);
    setMessages((prev) => [...prev, { id, question, loading: true }]);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      if (res.status === 429) throw new Error("You've reached today's limit of 5 requests. Try again tomorrow.");
      if (!res.ok || !res.body) throw new Error('Generation failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line);

          if (event.type === 'phase') {
            setMessages((prev) =>
              prev.map((m) => (m.id === id ? { ...m, loadingPhase: event.message } : m))
            );
          } else if (event.type === 'complete') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === id
                  ? {
                      ...m,
                      imageUrl: event.imageUrl,
                      headline: event.headline,
                      bullets: event.bullets,
                      paragraph: event.paragraph,
                      logos: event.logos,
                      textPosition: event.textPosition,
                      loading: false,
                      loadingPhase: undefined,
                    }
                  : m
              )
            );
          } else if (event.type === 'error') {
            throw new Error(event.error);
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, error: message, loading: false } : m))
      );
    } finally {
      setIsSubmitting(false);
      inputRef.current?.focus();
    }
  };

  return (
    <>
      {lightbox && <Lightbox url={lightbox.url} headline={lightbox.headline} bullets={lightbox.bullets} paragraph={lightbox.paragraph} logos={lightbox.logos} textPosition={lightbox.textPosition} onClose={() => setLightbox(null)} />}

      <div className="min-h-screen bg-gray-800 flex items-center justify-center p-4">
        <div
          className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          style={{ height: '680px' }}
        >
          {/* Header */}
          <div className="bg-gray-100 border-b border-gray-200 px-5 py-4 flex items-center gap-3 shrink-0">
            <IdeogramLogoSmall />
            <span className="text-gray-900 font-semibold text-base">Ideogram GTM Agent</span>
          </div>

          {/* Chat area */}
          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">

            {messages.length === 0 && (
              <>
                <div className="flex flex-col items-center text-center gap-3 pt-2 pb-2">
                  <IdeogramLogoLarge />
                  <div>
                    <p className="font-bold text-gray-900 text-lg">Ideogram Agent</p>
                    <p className="text-gray-400 text-sm mt-1">Visual answers powered by Claude + Ideogram</p>
                  </div>
                </div>

                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-700 max-w-[85%] min-h-[2.5rem]">
                    {typedMessage}
                    {typedMessage.length < WELCOME_MESSAGE.length && (
                      <span className="inline-block w-px h-3.5 bg-gray-500 ml-0.5 animate-pulse" />
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 items-start">
                  {CHIPS.map((chip) => (
                    <button
                      key={chip.label}
                      onClick={() => handleSubmit(null, chip.label)}
                      className="text-sm px-4 py-3 rounded-2xl border border-green-300 text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Message thread */}
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-3">
                <div className="flex justify-end">
                  <div className="bg-green-50 border border-green-300 text-gray-900 text-sm px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[85%]">
                    {msg.question}
                  </div>
                </div>

                <div className="flex flex-col gap-3 w-full">
                  {msg.loading ? (
                    msg.loadingPhase
                      ? <PhaseBubble phase={msg.loadingPhase} />
                      : <LoadingBubble />
                  ) : msg.error ? (
                    <div className="text-sm text-red-500 bg-red-50 border border-red-100 px-4 py-3 rounded-2xl max-w-[85%]">
                      {msg.error}
                    </div>
                  ) : msg.imageUrl ? (
                    <div
                      className="relative w-full rounded-2xl overflow-hidden border border-gray-200 shadow-md cursor-zoom-in"
                      onClick={() => setLightbox({ url: msg.imageUrl!, headline: msg.headline, bullets: msg.bullets, paragraph: msg.paragraph, logos: msg.logos, textPosition: msg.textPosition })}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={msg.imageUrl} alt={msg.question} className="w-full block" />
                      <ImageOverlay headline={msg.headline} bullets={msg.bullets} paragraph={msg.paragraph} logos={msg.logos} textPosition={msg.textPosition} size="sm" />
                    </div>
                  ) : null}
                </div>
              </div>
            ))}

            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div className="shrink-0 px-4 py-4 border-t border-gray-100">
            <form onSubmit={handleSubmit} className="flex gap-2 items-center">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message…"
                disabled={isSubmitting}
                className="flex-1 border border-green-300 rounded-full px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-400 disabled:opacity-50 transition"
              />
              <button
                type="submit"
                disabled={!input.trim() || isSubmitting}
                className="w-9 h-9 rounded-full bg-green-500 hover:bg-green-400 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors shrink-0"
              >
                <SendIcon />
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
