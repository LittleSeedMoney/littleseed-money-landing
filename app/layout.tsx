import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LittleSeed Money | Small steps. Wise growth.",
  description:
    "LittleSeed Money helps ordinary people understand money, make better financial decisions, and grow what they have been given with wisdom and purpose.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
