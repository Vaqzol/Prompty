import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopbar from '@/components/admin/AdminTopbar';
import '@/app/admin/admin.css';

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/admin/login');
  }

  // Double check admin role in DB
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, image: true, role: true },
  });

  if (!user || user.role !== 'ADMIN') {
    redirect('/admin/login');
  }

  // Count pending reports for sidebar badge
  const pendingReportsCount = await prisma.report.count({
    where: { status: 'PENDING' },
  });

  return (
    <div className="admin-layout-container">
      <AdminSidebar pendingReportsCount={pendingReportsCount} />

      <div className="admin-main-wrapper">
        <AdminTopbar user={{ name: user.name, image: user.image }} />
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
