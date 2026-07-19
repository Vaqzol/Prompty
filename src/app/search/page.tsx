import MainNavbar from '@/components/layout/MainNavbar';
import SearchClient from './SearchClient';
import { auth } from '@/auth';
import { searchPosts, searchUsers, searchTags, getAvailableLanguages } from '@/lib/actions/search';

interface SearchPageProps {
  searchParams: Promise<{ q?: string; type?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const session = await auth();
  const params = await searchParams;
  const query = params.q || '';

  // Fetch all results in parallel
  const [posts, users, tags, languages] = await Promise.all([
    query ? searchPosts(query) : Promise.resolve([]),
    query ? searchUsers(query) : Promise.resolve([]),
    query ? searchTags(query) : Promise.resolve([]),
    getAvailableLanguages(),
  ]);

  return (
    <>
      <MainNavbar user={session?.user} />
      <div className="search-page">
        <SearchClient
          query={query}
          initialPosts={posts}
          initialUsers={users}
          initialTags={tags}
          availableLanguages={languages}
          currentUserId={session?.user?.id}
        />
      </div>
    </>
  );
}
