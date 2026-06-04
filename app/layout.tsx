import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "Fierro Escuela",
  description: "Plataforma de capacitación de Fierro ERP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${roboto.variable}`}>
      <body className="min-h-screen bg-white text-[#212121] antialiased">
        {children}
      </body>
    </html>
  );
}
