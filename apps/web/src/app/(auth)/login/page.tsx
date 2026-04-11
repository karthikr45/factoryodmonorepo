export default function LoginPage(): JSX.Element {
  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-900">Sign in to FactoryOS</h1>
      <p className="mt-2 text-sm text-neutral-500">
        We will send a 6-digit code to your phone.
      </p>
      <form className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-neutral-700">Phone number</span>
          <input
            type="tel"
            placeholder="+91 98765 43210"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-md bg-brand-700 px-4 py-2 font-semibold text-white hover:bg-brand-800"
        >
          Send OTP
        </button>
      </form>
    </div>
  );
}
