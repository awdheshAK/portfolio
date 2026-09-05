import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, withErrorHandling, ApiError } from '@/lib/apiAuth';
import { parseSearchIntent } from '@/lib/ai';

const Schema = z.object({ query: z.string().min(1).max(300) });

export const POST = withErrorHandling(async (req: Request) => {
  await requireAdmin();
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) throw new ApiError('Missing query.', 400);
  return NextResponse.json({ intent: parseSearchIntent(parsed.data.query) });
});
