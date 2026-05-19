import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Rubik } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const rubik = Rubik({
  subsets: ["latin", "hebrew"],
  variable: "--font-rubik",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "TorApp — ניהול תורים", template: "%s | TorApp" },
  description: "מערכת ניהול תורים מקצועית לעסקים",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "TorApp" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0284C7",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${jakarta.variable} ${rubik.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
