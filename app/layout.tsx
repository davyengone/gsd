import type { Metadata } from "next";
import { DM_Sans, IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const display = Space_Grotesk({
  variable: "--font-display-face",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = DM_Sans({
  variable: "--font-body-face",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "GetShitDone — One entry point for a well-run life",
  description:
    "Talk to ChatGPT and your tools. GetShitDone organizes finance, journaling, health, and more into one living dashboard — automatically.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-mist text-ink">
        <Script id="gsd-theme-init" strategy="beforeInteractive">
          {`try{if(localStorage.getItem('gsd-theme')==='dark')document.documentElement.dataset.theme='dark'}catch{}`}
        </Script>
        {children}
      </body>
    </html>
  );
}
