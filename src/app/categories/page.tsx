import MainNavbar from '@/components/layout/MainNavbar';
import CategoriesClient from './CategoriesClient';
import { auth } from '@/auth';
import { getAllCategories, getTopContributors } from '@/lib/actions/trending';

export default async function CategoriesPage() {
  const session = await auth();
  const [categories, contributors] = await Promise.all([
    getAllCategories(),
    getTopContributors(5),
  ]);

  return (
    <>
      <MainNavbar user={session?.user} />
      <CategoriesClient categories={categories} contributors={contributors} />
    </>
  );
}
