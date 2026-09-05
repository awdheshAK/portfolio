import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/');
  }

  return (
    <div className="mx-auto flex max-w-[1600px]">
      <AdminSidebar />
      <div className="min-w-0 flex-1 p-6">{children}</div>
    </div>
  );
}
