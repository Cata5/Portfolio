import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import { Footer } from "@/components/footer";
import { Providers } from "@/components/providers";
import { ScrollProgress, SiteHeader } from "@/components/navigation/site-header";
import { site } from "@/data/site";
import { withBasePath } from "@/lib/base-path";

import "./globals.css";

// Inter stands in for PPNeueMontreal (the Dala system's single typeface) —
// weight 200 for body, 400 for display, 600 for uppercase labels.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.role}`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  keywords: [
    "software engineering student",
    "ETTI CTI Bucharest",
    "computer engineering",
    "web development",
    "machine learning",
    "android",
    "next.js",
    site.name,
  ],
  authors: [{ name: site.name }],
  creator: site.name,
  openGraph: {
    type: "website",
    url: site.url,
    siteName: `${site.name} — ${site.role}`,
    title: `${site.name} — ${site.role}`,
    description: site.description,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.role}`,
    description: site.description,
  },
  // Explicit metadata icon strings are NOT auto-prefixed with the GitHub
  // Pages basePath (unlike app/icon.svg or app/favicon.ico file conventions),
  // so the raw href gets the prefix here — otherwise the browser asks for
  // /icon.svg at the site root and 404s on a project site.
  icons: {
    icon: withBasePath("/icon.svg"),
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <Providers>
          <ScrollProgress />
          <SiteHeader />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
