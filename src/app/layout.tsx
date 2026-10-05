import type { Metadata, Viewport } from 'next';
import './globals.css';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export const metadata: Metadata = {
  title: 'Pénzügyi Sorsfordító',
  description:
    'Pénzügyi tudatossági szimulációs játék valós magyar gazdasági adatokkal. ' +
    'Hozd meg a döntéseidet, kezeld a pénzedet, és nézd meg, mire jutsz!',
  manifest: `${BASE}/manifest.json`,
  icons: { icon: `${BASE}/icon.svg`, apple: `${BASE}/icon-192.png` },
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
