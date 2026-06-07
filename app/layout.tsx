import type { Metadata } from "next";
import "./globals.css";
import { LenisProvider } from "@/providers/LenisProvider";

export const metadata: Metadata = {
  title: "The Ingredient List",
  description: "Web design and D2C automation studio. We build complete business systems.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* Playfair Display loaded via <link> so it works at runtime on Vercel */}
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <LenisProvider lerp={0.1} smoothWheel lockMs={400}>
          {children}
        </LenisProvider>
      </body>
    </html>
  );
}
