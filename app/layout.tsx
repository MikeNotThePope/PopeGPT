import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ChatProvider } from "@/lib/ChatContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PopeGPT - AI Chat Interface",
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
        <link rel="icon" id="favicon" href="/favicon.svg" type="image/svg+xml" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                const favicon = document.getElementById('favicon');

                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                  if (favicon) favicon.href = '/favicon-dark.svg';
                } else {
                  if (favicon) favicon.href = '/favicon.svg';
                }

                // Listen for theme changes
                window.addEventListener('storage', (e) => {
                  if (e.key === 'theme') {
                    const favicon = document.getElementById('favicon');
                    if (favicon) {
                      favicon.href = e.newValue === 'dark' ? '/favicon-dark.svg' : '/favicon.svg';
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
