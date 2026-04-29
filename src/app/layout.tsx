import type { Metadata } from "next";
import { sourceCodePro } from "@/shared/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Udemy Clone",
  description: "Course marketplace frontend",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={ sourceCodePro.variable }>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
