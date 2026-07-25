import { getTranslations } from "next-intl/server";

export async function CatalogHero() {
  const t = await getTranslations("CatalogHero");

  return (
    <section className="w-full">
      <h1 className="w-full text-left text-[40px] font-medium leading-[1.15] text-(--color-text-primary) md:text-[52px] lg:text-[64px]">
        {t.rich("title", {
          highlight: (chunks) => (
            <span className="bg-(--color-catalog-highlight) px-1 py-0.5 text-(--color-blue)">{chunks}</span>
          ),
        })}
      </h1>
    </section>
  );
}
