import { notFound } from 'next/navigation';
import MainNavbar from '@/components/layout/MainNavbar';
import { auth } from '@/auth';
import { getPublicCollectionDetail } from '@/lib/actions/bookmark';
import CollectionDetailClient from './CollectionDetailClient';

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  const collection = await getPublicCollectionDetail(id);

  if (!collection) {
    notFound();
  }

  return (
    <>
      <MainNavbar user={session?.user} />
      <CollectionDetailClient
        collection={collection}
        currentUserId={session?.user?.id}
      />
    </>
  );
}
