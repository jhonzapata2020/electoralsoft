import type { Metadata, Viewport } from 'next';
import './globals.css';
import NetworkBanner from '../components/NetworkBanner';

export const metadata: Metadata = {
  title: 'Janier Lloreda | Plataforma Oficial de Campaña Turbo',
  description: 'Sistema Electoral y Control Territorial para el Distrito de Turbo, Antioquia.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0080FF',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for (let registration of registrations) {
                    registration.unregister();
                  }
                });
              }
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
        <NetworkBanner />
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
