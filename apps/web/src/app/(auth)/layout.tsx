import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Left visual side — hidden on mobile */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 lg:block">
        {/* Animated blobs */}
        <div className="absolute -top-32 -left-32 h-96 w-96 animate-blob rounded-full bg-highlight-400/30 mix-blend-screen blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-96 w-96 animate-blob rounded-full bg-accent-300/20 mix-blend-screen blur-3xl [animation-delay:2s]" />
        <div className="absolute -bottom-32 left-1/4 h-96 w-96 animate-blob rounded-full bg-brand-400/30 mix-blend-screen blur-3xl [animation-delay:4s]" />

        {/* Noise/grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Content */}
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Link href="/" className="inline-flex items-center gap-2 animate-fade-in-down">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-sm font-bold text-brand-900">
              F
            </div>
            <span className="text-lg font-bold">FactoryOS</span>
          </Link>

          <div className="max-w-md space-y-6">
            <div className="inline-block animate-fade-in rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
              Built for Indian manufacturing
            </div>
            <h2 className="animate-fade-in-up text-4xl font-bold leading-tight [animation-delay:100ms]">
              Run your factory.
              <br />
              <span className="bg-gradient-to-r from-accent-300 to-highlight-400 bg-clip-text text-transparent">
                Your books write themselves.
              </span>
            </h2>
            <p className="animate-fade-in-up text-lg leading-relaxed text-white/70 [animation-delay:200ms]">
              One platform. Factory, Agency, and CA — connected. Every business event
              automatically creates an accounting entry.
            </p>

            <ul className="animate-fade-in-up space-y-3 [animation-delay:300ms]">
              {[
                'Phone + OTP login — no passwords',
                'Auto-generated invoices with GST',
                'Live trial balance for your CA',
                'WhatsApp alerts to workers',
              ].map((item, i) => (
                <li
                  key={item}
                  className="flex items-center gap-3 animate-slide-in-left text-white/80"
                  style={{ animationDelay: `${400 + i * 80}ms` }}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-300/20 text-xs text-accent-300">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between text-xs text-white/40">
            <span>© {new Date().getFullYear()} FactoryOS</span>
            <a
              href="https://mktechmonk.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-white/70"
            >
              Powered by <span className="font-semibold text-white/60">MK Tech Monk</span>
            </a>
          </div>
        </div>
      </div>

      {/* Right form side */}
      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-md animate-fade-in-up [animation-delay:200ms]">
          {children}
        </div>
      </div>
    </div>
  );
}
