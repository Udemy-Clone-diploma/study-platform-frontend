import Image from "next/image";

export type CategoryCardData = {
  title: string;
  description: string;
  iconSrc: string;
  shadowColor: string;
};

type Props = { card: CategoryCardData };

export function CategoryCard({ card }: Props) {
  return (
    <div
      className="category-card-item"
      style={{
        background: "var(--color-bg)",
        boxShadow: card.shadowColor,
        borderRadius: "1.04vw",
        width: "clamp(330px, 17.71vw, 340px)",
        height: "clamp(210px, 13.54vw, 260px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        transition: "transform 0.25s ease",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "clamp(16px, 2.08vw, 30px)",
          width: "clamp(260px, 13.9vw, 267px)",
        }}
      >
        <div
          style={{
            width: "clamp(28px, 2.08vw, 40px)",
            height: "clamp(28px, 2.08vw, 40px)",
            position: "relative",
          }}
        >
          <Image src={card.iconSrc} alt="" fill style={{ objectFit: "contain" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.625vw" }}>
          <h3
            className="text-left text-xl leading-none font-semibold lg:text-left lg:text-[1.04vw] lg:leading-[1.25] lg:font-normal"
            style={{
              fontFamily: "var(--font-base)",
              color: "var(--color-text-primary)",
              margin: 0,
            }}
          >
            {card.title}
          </h3>
          <p
            className="text-left text-base leading-none font-normal lg:text-left lg:text-[0.833vw] lg:leading-[1.3]"
            style={{
              fontFamily: "var(--font-base)",
              color: "var(--color-text-secondary)",
              margin: 0,
            }}
          >
            {card.description}
          </p>
        </div>
      </div>
    </div>
  );
}
