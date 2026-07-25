import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { mulish, sourceCodePro } from "@/shared/lib/fonts";
import { NavigationLoadingOverlay } from "@/shared/ui/NavigationLoadingOverlay";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexo4you",
  description: "Course marketplace frontend",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className={`${mulish.variable} ${sourceCodePro.variable}`}>
      <body className="min-h-screen flex flex-col">
        <NextIntlClientProvider messages={messages}>
          {children}
          <NavigationLoadingOverlay />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
