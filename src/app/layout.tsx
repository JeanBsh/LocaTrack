import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AceternitySidebar from "@/components/layout/AceternitySidebar";
import AuthProvider from "@/components/auth/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LocaTrack",
  description: "Gestion Immobilière",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <AceternitySidebar>
            {children}
          </AceternitySidebar>
        </AuthProvider>
      </body>
    </html>
  );
}
