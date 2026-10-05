import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { UploadProvider } from "@/components/upload/UploadProvider";
import "./globals.css";

// Primary: Newsreader, the editorial serif for headlines, painting titles and
// the italic accents. Loaded without its optical-size (opsz) axis: that axis
// nearly doubled the font download (325KB → 172KB in total without it) and
// cost ~6 Lighthouse points, for a barely visible gain at display sizes.
const newsreader = Newsreader({
  variable: "--font-newsreader",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

// Secondary: Geist for the interface (body, labels, buttons).
const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

// Geist Mono for data only: hex codes, token names and exported code.
// Kept preloaded (it's small, 23KB): theme pages show hex codes near the top,
// and loading it late made that text swap fonts and shift the layout.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hueprint",
  description: "Any painting → a UI theme you can actually ship.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${newsreader.variable} ${geist.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only z-50 rounded-full bg-ink px-4 py-2 text-paper focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <UploadProvider>
          <SiteHeader />
          <main id="main" className="flex flex-1 flex-col">
            {children}
          </main>
          <SiteFooter />
        </UploadProvider>
      </body>
    </html>
  );
}
