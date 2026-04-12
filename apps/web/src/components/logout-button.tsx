'use client';

import { useRouter } from 'next/navigation';

export function LogoutButton(): JSX.Element {
  const router = useRouter();

  const logout = (): void => {
    // Clear the auth cookies
    document.cookie = 'factoryos_at=; Max-Age=0; path=/';
    document.cookie = 'factoryos_rt=; Max-Age=0; path=/';
    document.cookie = 'factoryos_user=; Max-Age=0; path=/';
    router.push('/login');
  };

  return (
    <button
      onClick={logout}
      className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white"
    >
      Sign out
    </button>
  );
}
