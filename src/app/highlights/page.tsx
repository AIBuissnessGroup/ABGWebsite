import type { Metadata } from 'next';
import Highlights from '@/components/Highlights';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Highlights - AI Business Group | University of Michigan',
  description:
    'Recaps and highlights from AI Business Group milestones, including our SXSW 2026 University of Michigan showcase.',
};

export default function HighlightsPage() {
  return (
    <main className="bg-[#00274c] text-white font-bold">
      <Highlights />
      <Footer />
    </main>
  );
}
