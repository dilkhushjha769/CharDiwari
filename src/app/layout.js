import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import SmoothScroll from "@/components/SmoothScroll";
import ThemeProvider from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Phone browser bars match the page in both themes (follows the system setting).
export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0f0d0b" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
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
        <ThemeProvider>
          <SmoothScroll />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
