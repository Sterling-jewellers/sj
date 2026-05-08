import SettingDetailClient from './_SettingDetailClient';

export default function SettingDetailPage({ params }: { params: { slug: string } }) {
  return <SettingDetailClient slug={params.slug} />;
}
