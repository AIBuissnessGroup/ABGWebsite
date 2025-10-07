import EditPostClient from '../../../../../../components/admin/EditPostClient';

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;
  
  return <EditPostClient postId={id} />;
}