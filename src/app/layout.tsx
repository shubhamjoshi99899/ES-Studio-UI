import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppLayoutWrapper from "./components/AppLayoutWrapper";
import { ThemeProvider } from "@/components/theme-provider";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SocialMetrics | Analytics Dashboard",
  description: "Cross-channel social media performance",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {/* 2. Wrap AppLayoutWrapper with Providers */}
          <Providers>
            <AppLayoutWrapper>{children}</AppLayoutWrapper>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}