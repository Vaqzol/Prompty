import MainNavbar from '@/components/layout/MainNavbar';
import CategoryDetailClient from './CategoryDetailClient';
import { auth } from '@/auth';
import { getCategoryPosts, getTopContributors } from '@/lib/actions/trending';
import { notFound } from 'next/navigation';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryDetailPage({ params }: CategoryPageProps) {
  const session = await auth();
  const { slug } = await params;

  const [categoryData, contributors] = await Promise.all([
    getCategoryPosts(slug, 'all'),
    getTopContributors(5),
  ]);

  if (!categoryData) {
    notFound();
  }

  return (
    <>
      <MainNavbar user={session?.user} />
      <CategoryDetailClient
        category={categoryData.category}
        initialPosts={categoryData.posts}
        contributors={contributors}
        currentUserId={session?.user?.id}
      />
    </>
  );
}
