import Providers from '@/components/Providers';
import '../globals.css';

export const metadata = {
  title: 'AI Business Group - Links',
  description: 'All links for AI Business Group at University of Michigan',
  openGraph: {
    title: 'AI Business Group - Links',
    description: 'All links for AI Business Group at University of Michigan',
    images: ['/logo.png'],
  },
};

export default function LinkBioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-[#00274c] via-[#003366] to-[#001a33]">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}