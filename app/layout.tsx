import type { Metadata, Viewport } from "next";
import { Playfair_Display, DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const dmMono = DM_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#fdfdfc",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "notetoself — AI-Powered Study Platform",
    template: "%s | notetoself",
  },
  description:
    "Track study sessions, organize materials, and let AI turn your study habits into personalized insights to learn faster and retain more.",
  keywords: [
    "AI study assistant",
    "spaced repetition",
    "flashcards",
    "study tracker",
    "exam prep",
    "note taking",
    "Groq AI",
  ],
  authors: [{ name: "Nathan Gefania" }],
  openGraph: {
    title: "notetoself — AI-Powered Study Platform",
    description:
      "Study smarter, not harder. Track sessions, map materials, and detect learning pitfalls with AI.",
    url: "https://notetoself.app",
    siteName: "notetoself",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "notetoself — AI-Powered Study Platform",
    description:
      "Study smarter, not harder. AI-driven personalized insights for student mastery.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${playfair.variable} ${dmMono.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
        {children}
      </body>
    </html>
  );
}
