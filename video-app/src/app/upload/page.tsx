import { prisma } from '@/lib/prisma';
import UploadDashboard from '@/components/upload/UploadDashboard';

export const metadata = { title: 'Upload a video' };
export const dynamic = 'force-dynamic';

export default async function UploadPage() {
  const categories = await prisma.category.findMany({ orderBy: { order: 'asc' }, select: { id: true, name: true } });

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold mb-1">Upload a video</h1>
      <p className="text-surface-500 mb-8">MP4, MOV, WebM, AVI, or MKV. Large files upload in chunks and can be paused and resumed.</p>
      <UploadDashboard categories={categories} />
    </div>
  );
}
