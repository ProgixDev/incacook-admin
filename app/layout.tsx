import type { Metadata } from "next";
import "./globals.css";
import { fraunces, inter } from "./fonts";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "IncaCook · Admin",
  description: "Tableau de bord administrateur IncaCook",
  icons: {
    icon: "/app_logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-screen bg-background text-on-surface antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
