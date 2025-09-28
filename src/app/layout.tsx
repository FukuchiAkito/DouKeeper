import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AmplifyProvider } from "@/components/providers/AmplifyProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DouKeeper | Inventory Management for Doujin Works",
  description:
    "DouKeeper helps doujin creators keep track of inventory, distribution records, and events from a single dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-slate-100 antialiased`}
      >
        <AmplifyProvider>{children}</AmplifyProvider>
      </body>
    </html>
  );
}
