import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pénzügyi Sorsfordító',
  description:
    'Pénzügyi tudatossági szimulációs játék valós magyar gazdasági adatokkal. ' +
    'Hozd meg a döntéseidet, kezeld a pénzedet, és nézd meg, mire jutsz!',
  manifest: '/sorsfordito/manifest.json',
  icons: { icon: '/sorsfordito/icon.svg', apple: '/sorsfordito/icon-192.png' },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Sorsfordító',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0F172A',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hu" className="dark">
      <body className="min-h-screen safe-top safe-bottom">
        <main className="mx-auto max-w-md min-h-screen flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
