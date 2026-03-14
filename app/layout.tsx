import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dew I?",
  description: "Stardew Valley item reference",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <footer className="mt-12 py-4 text-center text-xs text-muted-foreground border-t border-border">
          Data &amp; sprites from{" "}
          <a
            href="https://stardewvalleywiki.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            Stardew Valley Wiki
          </a>{" "}
          · Stardew Valley by{" "}
          <a
            href="https://x.com/concernedape"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            ConcernedApe
          </a>
        </footer>
      </body>
    </html>
  );
}
