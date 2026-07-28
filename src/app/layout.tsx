import type { Metadata } from "next";
import { Sora, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const sora = Sora({
  variable: "--font-sans",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DBYLE — Don't believe your lying eyes",
  description:
    "The social network for constructive disagreement. Create debates, map arguments, follow public opinion, and turn thousands of voices into collective intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${sora.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--color-canvas)] text-[var(--color-ink)]">
        {children}
      </body>
    </html>
  );
}
