import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://docsend2pdf.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "DocSend to PDF — Convert DocSend Documents to PDF",
    template: "%s | DocSend to PDF",
  },
  description:
    "Free online tool to convert DocSend presentations and documents to downloadable PDF files. Supports email-gated and passcode-protected documents. No data stored.",
  keywords: [
    "DocSend to PDF",
    "DocSend converter",
    "DocSend PDF download",
    "convert DocSend to PDF",
    "DocSend scraper",
    "save DocSend as PDF",
    "DocSend document download",
    "docsend2pdf",
    "DocSend PDF export",
    "download DocSend presentation",
  ],
  authors: [{ name: "DocSend2PDF" }],
  creator: "DocSend2PDF",
  publisher: "DocSend2PDF",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "DocSend to PDF",
    title: "DocSend to PDF — Convert DocSend Documents to PDF",
    description:
      "Free online tool to convert DocSend documents to downloadable PDF files. No signup, no data stored.",
  },
  twitter: {
    card: "summary_large_image",
    title: "DocSend to PDF — Convert DocSend Documents to PDF",
    description:
      "Free online tool to convert DocSend documents to downloadable PDF files. No signup, no data stored.",
  },
  alternates: {
    canonical: SITE_URL,
  },
  other: {
    "application-name": "DocSend to PDF",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}`,
          }}
        />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
