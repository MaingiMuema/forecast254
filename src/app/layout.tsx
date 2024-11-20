import type { Metadata } from "next";
import { Inter } from 'next/font/google'
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from '@/hooks/useTheme'
import { AuthProvider } from '@/contexts/AuthContext'
import MainLayout from "@/components/Layout/MainLayout";
import { DataCollectionService } from '@/services/DataCollectionService';
import DataCollectionScheduler from "@/components/DataCollectionScheduler";
import MarketGenerationScheduler from "@/components/MarketGenerationScheduler";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const inter = Inter({ subsets: ['latin'] })

// Initialize data collection service
if (process.env.NODE_ENV === 'production') {
  DataCollectionService.getInstance();
}

export const metadata: Metadata = {
  title: "Forecast254 - Kenya's First Prediction Market Platform",
  description: "Trade on future events and earn rewards for accurate predictions in Kenya's first prediction market platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.className} antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>
            <MainLayout>
              {children}
              <DataCollectionScheduler />
              <MarketGenerationScheduler />
            </MainLayout>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
