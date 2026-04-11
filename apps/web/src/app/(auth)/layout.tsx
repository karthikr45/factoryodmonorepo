export default function AuthLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50 p-6">
      <div className="w-full max-w-md rounded-xl border border-brand-100 bg-white p-8 shadow-sm">
        {children}
      </div>
    </div>
  );
}
