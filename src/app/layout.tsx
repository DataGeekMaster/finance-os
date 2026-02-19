import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "./components/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Catatan Keuangan',
  description: 'Personal Financial Freedom OS',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="flex h-screen bg-[#191919] overflow-hidden">
          {/* Global Navigation (Sidebar + Mobile Navbar) */}
          <Navigation />
          
          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto pt-16 md:pt-0">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
