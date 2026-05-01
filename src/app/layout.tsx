import type { Metadata } from "next";
import { mulish, sourceCodePro } from "@/shared/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexo4you",
  description: "Course marketplace frontend",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${mulish.variable} ${sourceCodePro.variable}`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
