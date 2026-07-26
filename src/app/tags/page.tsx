import MainNavbar from '@/components/layout/MainNavbar';
import TagsClient from './TagsClient';
import { auth } from '@/auth';
import { getAllTags, getTopContributors } from '@/lib/actions/trending';

export default async function TagsPage() {
  const session = await auth();
  const [tags, contributors] = await Promise.all([
    getAllTags(),
    getTopContributors(5),
  ]);

  return (
    <>
      <MainNavbar user={session?.user} />
      <TagsClient tags={tags} contributors={contributors} />
    </>
  );
}
