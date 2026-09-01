import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "imedit — Local image editor",
  description: "A private, browser-only image editor for quick, thoughtful edits.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
