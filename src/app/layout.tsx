import type { Metadata, Viewport } from 'next';
import './globals.css';
import NetworkBanner from '../components/NetworkBanner';

export const metadata: Metadata = {
  title: 'Janier Lloreda Valencia | Control Territorial • Turbo 2026',
  description: 'Plataforma Oficial de Control Territorial y Censo Electoral de los 11 Equipos Operativos del Distrito Especial de Turbo.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Janier Lloreda Valencia | Alcaldía de Turbo 2026',
    description: 'Plataforma Oficial de Control Territorial y Censo Electoral de los 11 Equipos Operativos del Distrito Especial de Turbo.',
    siteName: 'Janier Lloreda Valencia',
    locale: 'es_CO',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Janier Lloreda Valencia - Campaña Oficial Turbo 2026',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Janier Lloreda Valencia | Alcaldía de Turbo 2026',
    description: 'Plataforma Oficial de Control Territorial y Censo Electoral de los 11 Equipos Operativos.',
    images: ['/og-image.png'],
  },
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
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta property="og:image" content="/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="/og-image.png" />
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
