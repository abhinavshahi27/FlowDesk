import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlowDesk",
  description: "Lite and bright team task manager",
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
