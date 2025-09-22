import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Case Tech F25 Dashboard',
  description: 'Analytics dashboard for Case Tech F25',
};

export default function CaseTechLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-screen overflow-hidden" style={{ height: '100vh', overflow: 'hidden' }}>
      {children}
    </div>
  );
}