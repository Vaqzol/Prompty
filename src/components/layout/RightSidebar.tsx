import TopContributors from '@/components/shared/TopContributors';
import { getTopContributors } from '@/lib/actions/trending';

export default async function RightSidebar() {
  const contributors = await getTopContributors(5);

  return (
    <aside className="right-sidebar">
      <TopContributors contributors={contributors} />
    </aside>
  );
}

