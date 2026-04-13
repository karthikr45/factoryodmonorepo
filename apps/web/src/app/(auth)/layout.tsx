export default function AuthLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-50 p-6">
      <div className="w-full max-w-md rounded-xl border border-brand-100 bg-white p-8 shadow-sm">
        {children}
      </div>
      <a
        href="https://mktechmonk.com"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 text-xs text-neutral-500 hover:text-brand-700"
      >
        Powered by <span className="font-semibold text-brand-800">MK Tech Monk</span>
      </a>
    </div>
  );
}
