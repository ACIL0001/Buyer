
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Test Metadata Static - MazadClick',
  description: 'This is a static metadata test page to verify Vercel rendering.',
  openGraph: {
    title: 'Test Metadata Static - MazadClick',
    description: 'This is a static metadata test page to verify Vercel rendering.',
    type: 'website',
    images: ['https://mazadclick.vercel.app/assets/images/logo-dark.png'],
  },
};

export default async function StaticTestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div style={{ padding: 40, fontFamily: 'system-ui' }}>
      <h1>Static Metadata Test Page</h1>
      <p>ID: {id}</p>
      <p>This page has hardcoded Open Graph tags. If you share this link and see "Test Metadata Static", then Vercel is rendering metadata correctly.</p>
      <p>If you see "MazadClick", then the root layout is overriding it.</p>
    </div>
  );
}
