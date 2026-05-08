import type { Metadata } from "next";
import { Poppins, Roboto } from "next/font/google";
import { SocketProvider } from "@/contexts/SocketContext";
import { BottomNav } from "@/components/layout/BottomNav";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "NEXU - Academic Platform",
  description: "Plataforma academica para Ingenieria y Arquitectura",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${poppins.variable} ${roboto.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-brand-gray pb-24">
        <SocketProvider>
          {children}
          <BottomNav />
        </SocketProvider>
      </body>
    </html>
  );
}
