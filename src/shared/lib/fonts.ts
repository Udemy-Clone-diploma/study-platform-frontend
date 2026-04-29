import { Mulish, Source_Code_Pro } from "next/font/google";

export const mulish = Mulish({
    subsets: ["latin", "cyrillic"],
    weight: ["400", "500", "600", "700"],
    variable: "--font-mulish",
});

export const sourceCodePro = Source_Code_Pro({
    subsets: ["latin", "cyrillic"],
    weight: ["400", "500", "600", "700"],
    variable: "--font-source-code-pro",
});