import type { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { env } from './env';
import { logAudit } from './audit';

export const authOptions: AuthOptions = {
  secret: env.nextAuthSecret,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Email and password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });
        if (!user) return null;

        if (user.status !== 'ACTIVE') {
          throw new Error(
            user.status === 'BANNED'
              ? 'This account has been permanently banned.'
              : 'This account is suspended. Contact support if you believe this is an error.',
          );
        }

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        await logAudit({ userId: user.id, action: 'auth.login' });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          username: user.username,
          image: user.avatarUrl ?? undefined,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.username = (user as any).username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).username = token.username;
      }
      return session;
    },
  },
};
