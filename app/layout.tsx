import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maidan — Builder Command Center",
  description: "Internal operations console for the Maidan grassroots cricket platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
