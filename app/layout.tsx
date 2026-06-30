import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plainspeak — make confusing documents make sense",
  description:
    "Paste any dense document and get it in plain words, the parts that affect you, and the exact questions to ask.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
