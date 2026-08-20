import type { Metadata } from 'next';
import { Inter, IBM_Plex_Sans_Thai } from 'next/font/google';
import './globals.css';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import ThemeProvider from '@/components/providers/ThemeProvider';
import CodeThemeProvider from '@/components/providers/CodeThemeProvider';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['thai'],
  display: 'swap',
  variable: '--font-ibm-plex-sans-thai',
});

export const metadata: Metadata = {
  title: {
    default: 'Prompty — Developer & Creator Prompt Hub',
    template: '%s | Prompty',
  },
  description: 'แพลตฟอร์มแบ่งปัน Prompt และ Code Snippet สำหรับ Developer และ Creator',
};

export default async function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  const session = await auth();
  let userTheme = 'light';
  let userCodeTheme = 'VS Code Dark Modern';

  if (session?.user?.id) {
    try {
      const prefs = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { theme: true, codeTheme: true },
      });
      if (prefs) {
        userTheme = prefs.theme || 'light';
        userCodeTheme = prefs.codeTheme || 'VS Code Dark Modern';
      }
    } catch {
      /* ignore */
    }
  }

  return (
    <html
      lang="th"
      className={`${inter.variable} ${ibmPlexSansThai.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var p = window.location.pathname;
                  var isFixedTheme = p.startsWith('/admin');
                  if (isFixedTheme) {
                    document.documentElement.setAttribute('data-theme', 'light');
                  } else {
                    var t = localStorage.getItem('prompty-theme') || '${userTheme}';
                    var resolved = t;
                    if (t === 'system') {
                      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    }
                    document.documentElement.setAttribute('data-theme', resolved);
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider initialTheme={userTheme} isLoggedIn={!!session?.user?.id}>
          <CodeThemeProvider initialCodeTheme={userCodeTheme} isLoggedIn={!!session?.user?.id}>
            {children}
            {modal}
          </CodeThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
