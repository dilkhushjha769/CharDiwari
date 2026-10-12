import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import SmoothScroll from "@/components/SmoothScroll";
import ThemeProvider from "@/components/ThemeProvider";
import GlobalAnnouncementBanner from "@/components/GlobalAnnouncementBanner";
import PostHogProvider from "@/components/analytics/PostHogProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Theme configuration locked to clean light mode.
export const viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

export const metadata = {
  title: "Dwarkesh — Real Estate Group",
  description: "Buy, sell, rent, and invest in verified luxury homes, apartments, and modern villas across India.",
};

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning: next-themes sets the theme class on <html>
    // before React loads, so the server's markup differs there on purpose.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-white text-black`}
    >
      <body className="min-h-full flex flex-col bg-white text-black">
        <PostHogProvider>
          <ThemeProvider>
            <GlobalAnnouncementBanner />
            <SmoothScroll />
            {children}
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
