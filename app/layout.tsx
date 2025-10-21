import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ChatProvider } from "@/lib/ChatContext";

const inter = Inter({ subsets: ["latin"] });

const appName = `${process.env.NEXT_PUBLIC_USERNAME || 'Pope'}GPT`;

export const metadata: Metadata = {
  title: `${appName} - AI Chat Interface`,
  description: "A beautiful AI chat interface powered by Claude 3 Haiku",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" id="favicon" href="/api/favicon" type="image/svg+xml" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                const favicon = document.getElementById('favicon');
                let isDark = false;

                // Check user preference first, then system preference
                if (theme === 'dark' || theme === 'light') {
                  isDark = theme === 'dark';
                } else {
                  // No user preference - use system preference
                  isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                }

                if (isDark) {
                  document.documentElement.classList.add('dark');
                  if (favicon) favicon.href = '/api/favicon-dark';
                } else {
                  if (favicon) favicon.href = '/api/favicon';
                }

                // Listen for theme changes
                window.addEventListener('storage', (e) => {
                  if (e.key === 'theme') {
                    const favicon = document.getElementById('favicon');
                    if (favicon) {
                      favicon.href = e.newValue === 'dark' ? '/api/favicon-dark' : '/api/favicon';
                    }
                  }
                });
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ChatProvider>{children}</ChatProvider>
      </body>
    </html>
  );
}
