import Providers from '@/components/Providers';
import '../globals.css';

export const metadata = {
  title: 'Case Tech F25 Dashboard',
  description: 'Analytics dashboard for Case Tech F25',
};

export default function CaseTechLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self' http: https: data: blob: 'unsafe-inline'; frame-src http: https: 'self';" />
      </head>
      <body className="h-screen overflow-hidden">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}