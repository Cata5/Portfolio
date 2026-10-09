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

/**
 * Structured data — Person + WebSite, mirroring content visible on the page
 * (name, role, tagline, real social links). No invented fields.
 */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${site.url}/#person`,
      name: site.name,
      url: site.url,
      jobTitle: site.role,
      description: site.tagline,
      sameAs: [site.github, site.linkedin, site.instagram],
      knowsAbout: [
        "Web Development",
        "Machine Learning",
        "Android",
        "Backend",
        "Embedded Systems",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${site.url}/#website`,
      url: site.url,
      name: `${site.name} - ${site.role}`,
      inLanguage: "en",
      publisher: { "@id": `${site.url}/#person` },
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} - ${site.role}`,
    template: `%s - ${site.name}`,
  },
  description: site.description,
  alternates: {
    canonical: site.url,
  },
  authors: [{ name: site.name }],
  creator: site.name,
  // Static og.png (public/) — a real .png URL so GitHub Pages serves it
  // with image/png and Twitter/Facebook validators accept it. Next joins
  // the relative path onto metadataBase (which carries /Portfolio), so
  // no withBasePath here — that would double-prefix. Regenerate og.png by
  // re-adding app/opengraph-image.tsx, building, copying out/opengraph-image
  // over public/og.png, and removing the route again.
  openGraph: {
    type: "website",
    url: site.url,
    siteName: `${site.name} - ${site.role}`,
    title: `${site.name} - ${site.role}`,
    description: site.description,
    locale: "en_US",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: `${site.name} - ${site.role}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} - ${site.role}`,
    description: site.description,
    images: ["/og.png"],
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
      <body suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for (var i = 0; i < registrations.length; i++) {
                    registrations[i].unregister();
                  }
                });
              }
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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
