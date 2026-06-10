import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LittleSeed Money | Small steps. Wise growth.",
  description:
    "Financial clarity for everyone. Understand money, make clearer decisions, and grow with wisdom and purpose.",
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
