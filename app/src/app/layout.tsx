import type { Metadata, Viewport } from 'next';
import { SettingsProvider } from '@/context/SettingsProvider';

export const metadata: Metadata = {
  title: 'A Thousand Ways to Say I Love You — Animated Love Heart',
  description:
    'An immersive animated heart woven from “I love you” in twenty languages. Personalize it with your names and message, then share the link.',
  keywords: ['love heart', 'i love you', 'animation', 'romantic gift', 'multilingual heart'],
  openGraph: {
    title: 'A Thousand Ways to Say I Love You',
    description:
      'Watch a glowing crimson heart beat itself into existence from love phrases in 20 languages — then make it yours.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#060208',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SettingsProvider>{children}</SettingsProvider>
      </body>
    </html>
  );
}
