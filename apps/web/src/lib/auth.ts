/**
 * NextAuth v5 config (Auth.js).
 * Uses the credentials provider to exchange a phone+OTP for a JWT from our NestJS API.
 * The real verifyOtp call will be wired in the next session — this is a scaffold.
 */
import NextAuth, { type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: 'Phone OTP',
      credentials: {
        phone: { label: 'Phone', type: 'tel' },
        code: { label: 'OTP', type: 'text' },
      },
      authorize: async (_credentials) => {
        // TODO: call POST /api/auth/otp/verify on the NestJS API.
        return null;
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
  callbacks: {
    authorized({ auth, request }) {
      const pathname = request.nextUrl.pathname;
      const isProtected =
        pathname.startsWith('/factory') ||
        pathname.startsWith('/agency') ||
        pathname.startsWith('/ca');
      if (!isProtected) return true;
      return Boolean(auth?.user);
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
