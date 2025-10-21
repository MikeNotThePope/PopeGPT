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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
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
                }

                // Set initial favicon
                const faviconUrl = isDark ? '/api/favicon-dark' : '/api/favicon';
                const link = document.createElement('link');
                link.id = 'favicon';
                link.rel = 'icon';
                link.type = 'image/svg+xml';
                link.href = faviconUrl;
                document.head.appendChild(link);
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
