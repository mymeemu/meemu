import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MEEMU — Seu espaço, suas regras",
    template: "%s | MEEMU",
  },
  description:
    "Crie seu espaço digital do seu jeito. Personalize seu perfil com widgets, temas e muito mais no MEEMU.",
  applicationName: "MEEMU",
  appleWebApp: {
    capable: true,
    title: "MEEMU",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
