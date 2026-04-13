'use client';

import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { apiCall } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  "What's my pending receivables?",
  "Which order has the highest delay?",
  "How many workers checked in today?",
  "What's my profit margin this month?",
  "Show me low stock items",
  "Which customer owes me the most?",
];

export function AIAssistant({ open, onClose }: { open: boolean; onClose: () => void }): JSX.Element | null {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your factory assistant. Ask me anything about your operations, finances, or workforce.",
    },
  ]);
  const [input, setInput] = useState('');
  const [pending, start] = useTransition();

  const send = (question: string): void => {
    if (!question.trim()) return;
    setMessages([...messages, { role: 'user', content: question }]);
    setInput('');
    start(async () => {
      try {
        const res = await apiCall<{ answer: string; confidence: string }>({
          url: '/ai/ask', method: 'POST', data: { question },
        });
        setMessages((m) => [...m, { role: 'assistant', content: res.answer }]);
      } catch (err) {
        setMessages((m) => [...m, { role: 'assistant', content: `Sorry, I had trouble: ${err instanceof Error ? err.message : 'unknown error'}` }]);
      }
    });
  };

  if (!open) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-md animate-fade-in-up">
      <div className="overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-brand-700 to-highlight-400 px-4 py-3 text-white">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <div>
              <div className="font-semibold">FactoryOS AI</div>
              <div className="text-xs text-white/70">Powered by Claude</div>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-white/10">✕</button>
        </div>

        {/* Messages */}
        <div className="h-96 overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                m.role === 'user'
                  ? 'rounded-br-none bg-brand-600 text-white'
                  : 'rounded-bl-none bg-neutral-100 text-neutral-800'
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {pending && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-none bg-neutral-100 px-4 py-2.5">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-brand-500" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-brand-500 [animation-delay:0.1s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-brand-500 [animation-delay:0.2s]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Suggestions */}
        {messages.length === 1 && (
          <div className="border-t border-neutral-100 px-4 py-2">
            <div className="text-xs font-semibold text-neutral-500">Try asking:</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {SUGGESTIONS.slice(0, 4).map((s) => (
                <button key={s} onClick={() => send(s)}
                  className="rounded-full border border-neutral-200 px-2.5 py-1 text-xs text-neutral-700 transition hover:border-brand-400 hover:bg-brand-50">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="flex gap-2 border-t border-neutral-100 p-3">
          <input value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about your factory..."
            className="flex-1 rounded-full border border-neutral-300 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            disabled={pending} />
          <Button type="submit" disabled={pending || !input.trim()}>Send</Button>
        </form>
      </div>
    </div>
  );
}

export function AIAssistantButton(): JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-brand-700 to-highlight-400 text-2xl text-white shadow-xl shadow-brand-600/40 transition hover:scale-110 animate-ring-pulse"
        title="Ask AI assistant">
        ✨
      </button>
      <AIAssistant open={open} onClose={() => setOpen(false)} />
    </>
  );
}
