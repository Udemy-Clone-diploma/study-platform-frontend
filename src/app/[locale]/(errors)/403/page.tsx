import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function ForbiddenPage() {
  const t = await getTranslations("Forbidden");
  const tCommon = await getTranslations("Common");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-5xl font-bold text-red-600">403</h1>
      <p className="text-xl text-gray-700">{t("title")}</p>
      <p className="text-sm text-gray-500">{t("description")}</p>
      <Link
        href="/"
        className="mt-4 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700"
      >
        {tCommon("backToHome")}
      </Link>
    </main>
  );
}
