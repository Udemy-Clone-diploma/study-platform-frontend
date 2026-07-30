import { getTranslations } from "next-intl/server";

export default async function AdminDashboardPage() {
  const t = await getTranslations("AdminDashboardPlaceholder");
  return (
    <section className="flex min-h-[calc(100vh-76px)] items-center justify-center bg-(--color-brand-lavender-soft)">
      <p className="text-base text-[#5e5e5e]">{t("comingSoon")}</p>
    </section>
  );
}
