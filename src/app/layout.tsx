import type { Metadata, Viewport } from "next";
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

export const metadata: Metadata = {
  metadataBase: new URL("https://ikspimantup.my.id"),
  title: {
    default: "SIKAP Mantup — IKSPI Kera Sakti Ranting Mantup, Lamongan",
    template: "%s | SIKAP Mantup",
  },
  description:
    "Sistem Informasi Keanggotaan dan Administrasi Perguruan internal IKSPI Kera Sakti Ranting Mantup, Kec. Mantup, Kab. Lamongan, Jawa Timur.",
  keywords: [
    "IKSPI",
    "Kera Sakti",
    "Mantup",
    "Lamongan",
    "SIKAP Mantup",
    "Pendataan Warga",
    "KTA IKSPI",
  ],
  authors: [{ name: "Pengurus IKSPI Kera Sakti Ranting Mantup" }],
  openGraph: {
    title: "SIKAP Mantup — IKSPI Kera Sakti Ranting Mantup",
    description:
      "Sistem Informasi Keanggotaan dan Administrasi Perguruan internal IKSPI Kera Sakti Ranting Mantup, Kab. Lamongan.",
    url: "https://ikspimantup.my.id",
    siteName: "SIKAP Mantup",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SIKAP Mantup — IKSPI Kera Sakti Ranting Mantup",
    description:
      "Sistem Informasi Keanggotaan dan Administrasi Perguruan internal IKSPI Kera Sakti Ranting Mantup, Lamongan.",
  },
  alternates: {
    canonical: "https://ikspimantup.my.id",
  },
};

export const viewport: Viewport = {
  themeColor: "#b91c1c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900">
        {children}
      </body>
    </html>
  );
}
