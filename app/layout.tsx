import type { Metadata } from "next";
import "./globals.css";
import { LenisProvider } from "@/providers/LenisProvider";

export const metadata: Metadata = {
  title: "The Ingredient List",
  description: "Web design and D2C automation studio",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/*
          LenisProvider wraps the entire application.
          Single scroll authority — nothing else reads window.scrollY.
          lockMs={400}: holds scroll for 400ms during entry animation.
          lerp={0.1}: interpolation factor (lower = smoother/heavier).
        */}
        <LenisProvider lerp={0.1} smoothWheel lockMs={400}>
          {children}
        </LenisProvider>
      </body>
    </html>
  );
}
