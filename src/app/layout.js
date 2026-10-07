import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { SmoothScroll } from "@/components/providers/smooth-scroll";
import { ThemedToaster, ThemeProvider } from "@/components/providers/theme-provider";
import { site } from "@/config/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

const title = "VitalSpace | Verified Properties in Ahmedabad & Gandhinagar";
const description =
  "Find verified, RERA-registered flats and new projects in Ahmedabad and Gandhinagar. Compare prices, plan your EMI and talk to a local property expert.";

export const metadata = {
  metadataBase: new URL(site.url),
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: site.name,
    title,
    description,
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "@id": `${site.url}/#real-estate-agent`,
  name: site.legalName,
  url: site.url,
  telephone: site.phone.display,
  email: site.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: site.address.street,
    addressLocality: site.address.city,
    addressRegion: site.address.region,
    postalCode: site.address.postalCode,
    addressCountry: "IN",
  },
  areaServed: [
    { "@type": "City", name: "Ahmedabad" },
    { "@type": "City", name: "Gandhinagar" },
  ],
};

export default function RootLayout({ children }) {
  return (
    // next-themes adds the theme class before hydration, hence the warning opt-out.
    <html
      lang="en-IN"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <ThemeProvider>
          <NuqsAdapter>{children}</NuqsAdapter>
          <SmoothScroll />
          <ThemedToaster position="bottom-center" offset={88} mobileOffset={88} />
        </ThemeProvider>
      </body>
    </html>
  );
}
