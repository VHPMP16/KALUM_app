import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ChatApp | Comunicação Corporativa",
    template: "%s | ChatApp",
  },
  description: "Plataforma privada de comunicação e colaboração corporativa.",
  applicationName: "ChatApp",
  referrer: "strict-origin-when-cross-origin",
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f4f7fb",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
