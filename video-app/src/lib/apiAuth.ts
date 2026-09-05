import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from './auth';

export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new ApiError('Authentication required.', 401);
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== 'ADMIN') throw new ApiError('Administrator access required.', 403);
  return user;
}

/** Wraps a route handler so unexpected errors never leak stack traces to clients. */
export function withErrorHandling<T extends (...args: any[]) => Promise<Response>>(handler: T): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof ApiError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      // eslint-disable-next-line no-console
      console.error('[api-error]', err);
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
    }
  }) as T;
}
